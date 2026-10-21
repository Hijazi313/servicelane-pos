import ts from 'typescript';
import { readdir, readFile } from 'node:fs/promises';
import { resolve, relative, join } from 'node:path';
import { pathToFileURL } from 'node:url';

const httpSymbols = new Set([
  'HttpException', 'HttpStatus', 'BadRequestException', 'UnauthorizedException', 'ForbiddenException',
  'NotFoundException', 'ConflictException', 'UnprocessableEntityException', 'ServiceUnavailableException',
  'InternalServerErrorException', 'BadGatewayException', 'GatewayTimeoutException', 'RequestTimeoutException',
  'PayloadTooLargeException', 'MethodNotAllowedException', 'NotAcceptableException', 'GoneException',
  'UnsupportedMediaTypeException', 'NotImplementedException', 'HttpVersionNotSupportedException',
  'Controller', 'Get', 'Post', 'Put', 'Patch', 'Delete', 'Head', 'Options', 'All', 'HttpCode', 'Header',
  'Redirect', 'Request', 'Response', 'Req', 'Res', 'Body', 'Param', 'Query', 'Headers', 'Ip', 'Session',
  'Catch', 'ExceptionFilter', 'ArgumentsHost', 'ExecutionContext', 'CanActivate',
]);
const statusNames = new Set(['status', 'statusCode', 'httpStatus', 'httpStatusCode', 'getStatus', 'getStatusCode']);
const literal = node => node && (ts.isStringLiteralLike(node) || ts.isNumericLiteral(node)) ? node.text : undefined;
const nameOf = node => {
  if (!node) return undefined;
  if (ts.isIdentifier(node) || ts.isStringLiteralLike(node)) return node.text;
  if (ts.isComputedPropertyName(node)) return literal(node.expression);
  return undefined;
};
const leaf = node => ts.isIdentifier(node) ? node.text : ts.isPropertyAccessExpression(node) ? node.name.text : undefined;
function httpModule(specifier) {
  return /^(?:node:)?https?$/.test(specifier) || /^(?:fastify|express|@nestjs\/platform-[^/]+)(?:\/|$)/.test(specifier) || /^@nestjs\/common\/(?:exceptions|decorators\/http|interfaces\/http|enums\/http-status)/.test(specifier)
    || /(?:^|\/)http(?:\/|$)/.test(specifier) || /\.(?:controller|filter|guard|decorator)(?:\.[cm]?js)?$/.test(specifier);
}

// Syntax-only checks: no application imports, configuration loading, compilation or database access.
export function inspectSource(filename, source) {
  const path = filename.replaceAll('\\', '/');
  const layer = /(?:^|\/)(domain|application)\//.exec(path)?.[1];
  if (!layer || !/\.tsx?$/.test(path)) return [];
  const file = ts.createSourceFile(filename, source, ts.ScriptTarget.Latest, true);
  const findings = [], aliases = new Set(), namespaces = new Set(), classes = [], errorNames = new Set(['Error']);
  const add = (node, rule, message) => {
    const { line, character } = file.getLineAndCharacterOfPosition(node.getStart(file));
    findings.push({ file: filename, line: line + 1, column: character + 1, rule, message });
  };
  for (const diagnostic of file.parseDiagnostics) {
    const { line, character } = file.getLineAndCharacterOfPosition(diagnostic.start ?? 0);
    findings.push({ file: filename, line: line + 1, column: character + 1, rule: 'PARSE', message: ts.flattenDiagnosticMessageText(diagnostic.messageText, ' ') });
  }
  const moduleReference = (node, specifier, bindings) => {
    if (httpModule(specifier) || (layer === 'domain' && /^@nestjs(?:\/|$)/.test(specifier))) {
      add(node, 'HTTP_IMPORT', `${layer} code imports or re-exports transport module '${specifier}'`);
      return;
    }
    if (specifier !== '@nestjs/common') return;
    if (bindings && ts.isNamespaceImport(bindings)) { namespaces.add(bindings.name.text); return; }
    if (!bindings || ts.isNamespaceExport(bindings)) {
      if (ts.isExportDeclaration(node)) add(node, 'HTTP_IMPORT', 'Wildcard Nest reexports expose transport symbols from application code');
      return;
    }
    for (const binding of bindings.elements ?? []) {
      const imported = (binding.propertyName ?? binding.name).text;
      if (httpSymbols.has(imported)) {
        aliases.add(binding.name.text);
        add(binding, 'HTTP_IMPORT', `${layer} code imports HTTP symbol '${imported}'`);
      }
    }
  };
  const visit = node => {
    if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
      if (node.moduleSpecifier.text === '@nestjs/common' && node.importClause?.name) namespaces.add(node.importClause.name.text);
      moduleReference(node, node.moduleSpecifier.text, node.importClause?.namedBindings);
    }
    if (ts.isExportDeclaration(node) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) moduleReference(node, node.moduleSpecifier.text, node.exportClause);
    if (ts.isImportEqualsDeclaration(node) && ts.isExternalModuleReference(node.moduleReference)) {
      const specifier = literal(node.moduleReference.expression);
      if (specifier) moduleReference(node, specifier);
    }
    if (ts.isCallExpression(node) && (node.expression.kind === ts.SyntaxKind.ImportKeyword || (ts.isIdentifier(node.expression) && node.expression.text === 'require'))) {
      const specifier = literal(node.arguments[0]);
      if (specifier) moduleReference(node, specifier);
    }
    if (ts.isImportTypeNode(node) && ts.isLiteralTypeNode(node.argument)) {
      const specifier = literal(node.argument.literal);
      if (specifier) moduleReference(node, specifier);
    }
    if (ts.isClassDeclaration(node) || ts.isClassExpression(node)) classes.push(node);
    ts.forEachChild(node, visit);
  };
  visit(file);
  const bases = node => node.heritageClauses?.filter(clause => clause.token === ts.SyntaxKind.ExtendsKeyword).flatMap(clause => clause.types.map(type => leaf(type.expression))) ?? [];
  // Resolve local inheritance (including a subclass declared before its base).
  let changed = true;
  while (changed) {
    changed = false;
    for (const node of classes) {
      const name = node.name?.text;
      if (name && !errorNames.has(name) && (name.endsWith('Error') || bases(node).some(base => errorNames.has(base) || base?.endsWith('Error') || base?.endsWith('Exception') || aliases.has(base)))) {
        errorNames.add(name); changed = true;
      }
    }
  }
  for (const node of classes) {
    if (!errorNames.has(node.name?.text) && !bases(node).some(base => errorNames.has(base) || base?.endsWith('Error') || base?.endsWith('Exception') || aliases.has(base))) continue;
    for (const member of node.members) {
      if (statusNames.has(nameOf(member.name))) add(member, 'ERROR_HTTP_STATUS', 'Error types must carry semantic reasons; map HTTP status in http/');
      const assignments = child => {
        if (ts.isBinaryExpression(child) && child.operatorToken.kind === ts.SyntaxKind.EqualsToken) {
          const target = child.left;
          const key = ts.isPropertyAccessExpression(target) ? target.name.text : ts.isElementAccessExpression(target) ? literal(target.argumentExpression) : undefined;
          if ((ts.isPropertyAccessExpression(target) || ts.isElementAccessExpression(target)) && target.expression.kind === ts.SyntaxKind.ThisKeyword && statusNames.has(key)) add(child, 'ERROR_HTTP_STATUS', 'Error instances must not assign HTTP status');
        }
        ts.forEachChild(child, assignments);
      };
      assignments(member);
      if (ts.isConstructorDeclaration(member)) {
        for (const parameter of member.parameters) if (statusNames.has(nameOf(parameter.name))) add(parameter, 'ERROR_HTTP_STATUS', 'Error constructors must not accept or own HTTP status');
      }
    }
  }
  const constructions = node => {
    const namespace = ts.isPropertyAccessExpression(node) ? node.expression : ts.isQualifiedName(node) ? node.left : undefined;
    const member = ts.isPropertyAccessExpression(node) ? node.name.text : ts.isQualifiedName(node) ? node.right.text : undefined;
    if (namespace && ts.isIdentifier(namespace) && namespaces.has(namespace.text) && httpSymbols.has(member)) add(node, 'HTTP_IMPORT', `${layer} code uses HTTP symbol '${member}'`);
    if (ts.isNewExpression(node)) {
      const name = leaf(node.expression);
      if (name && ((httpSymbols.has(name) && name.endsWith('Exception')) || aliases.has(name))) add(node, 'HTTP_EXCEPTION', 'Construct HTTP exceptions in http/, not domain/application');
    }
    ts.forEachChild(node, constructions);
  };
  constructions(file);
  return findings.sort((a, b) => a.line - b.line || a.column - b.column || a.rule.localeCompare(b.rule));
}

async function sources(folder) {
  const files = [];
  for (const entry of (await readdir(folder, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
    const path = join(folder, entry.name);
    if (entry.isDirectory()) files.push(...await sources(path));
    else if (entry.isFile() && /\.tsx?$/.test(entry.name)) files.push(path);
  }
  return files;
}
export async function checkModules(root, selected = []) {
  const modules = resolve(root, 'src/modules');
  const names = selected.length ? [...new Set(selected)].sort() : (await readdir(modules, { withFileTypes: true })).filter(entry => entry.isDirectory()).map(entry => entry.name).sort();
  const findings = []; let count = 0;
  for (const name of names) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name)) throw new Error('Invalid module selector');
    const files = await sources(join(modules, name));
    for (const file of files) {
      if (!/[\\/](?:domain|application)[\\/]/.test(file)) continue;
      findings.push(...inspectSource(relative(root, file), await readFile(file, 'utf8'))); count++;
    }
  }
  if (!count) throw new Error('No domain/application source files found');
  return { count, findings };
}
async function main() {
  const selected = [], args = process.argv.slice(2);
  while (args.length) {
    if (args.shift() !== '--module' || !args[0]) throw new Error('Usage: check-http-boundaries.mjs [--module name ...]');
    selected.push(args.shift());
  }
  const { count, findings } = await checkModules(resolve(import.meta.dirname, '..'), selected);
  for (const finding of findings) console.error(`${finding.file}:${finding.line}:${finding.column} [${finding.rule}] ${finding.message}`);
  console.log(`HTTP boundary check: ${count} files, ${findings.length} violation(s).`);
  process.exitCode = findings.length ? 1 : 0;
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  await main().catch(error => { console.error(`HTTP boundary check failed: ${error.message}`); process.exitCode = 1; });
}
