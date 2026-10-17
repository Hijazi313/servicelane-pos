import {
  Controller,
  Get,
  Post,
  Patch,
  Req,
  Res,
  Body,
  Param,
  HttpCode,
} from "@nestjs/common";
import {
  AccessService,
  type SessionResult,
} from "../application/access.service.js";
import {
  AccessEntry,
  cookie,
  proof,
  type AccessRequest,
  type AccessReply,
} from "./boundary.js";
import { canonicalSource } from "./configuration.js";

@Controller("api/v1")
export class AccessController {
  constructor(private readonly access: AccessService) {}
  private session(reply: AccessReply, result: SessionResult) {
    reply.header("Set-Cookie", [
      cookie("__Host-session", result.sessionToken),
      cookie("__Host-prelogin", "", true),
    ]);
    return { csrfToken: result.csrfToken, account: result.account };
  }
  @Get("auth/csrf")
  @AccessEntry("public")
  async csrf(
    @Req() request: AccessRequest,
    @Res({ passthrough: true }) reply: AccessReply,
  ) {
    const result = await this.access.bootstrap(proof(request));
    if ("preloginToken" in result && result.preloginToken)
      reply.header(
        "Set-Cookie",
        cookie("__Host-prelogin", result.preloginToken),
      );
    return { csrfToken: result.csrfToken };
  }
  @Post("auth/login")
  @HttpCode(200)
  @AccessEntry("public")
  async login(
    @Body() body: unknown,
    @Req() request: AccessRequest,
    @Res({ passthrough: true }) reply: AccessReply,
  ) {
    return this.session(
      reply,
      await this.access.login(
        body,
        proof(request),
        canonicalSource(request.ip),
      ),
    );
  }
  @Post("auth/logout")
  @HttpCode(204)
  @AccessEntry("public")
  async logout(
    @Req() request: AccessRequest,
    @Res({ passthrough: true }) reply: AccessReply,
  ) {
    await this.access.logout(proof(request));
    reply.header("Set-Cookie", [
      cookie("__Host-session", "", true),
      cookie("__Host-prelogin", "", true),
    ]);
  }
  @Get("auth/me")
  @AccessEntry("staff")
  me(@Req() request: AccessRequest) {
    return this.access.me(proof(request));
  }
  @Get("context")
  @AccessEntry("staff")
  context(@Req() request: AccessRequest) {
    return this.access.me(proof(request), true);
  }
  @Post("auth/password")
  @HttpCode(200)
  @AccessEntry("restricted")
  async password(
    @Body() body: unknown,
    @Req() request: AccessRequest,
    @Res({ passthrough: true }) reply: AccessReply,
  ) {
    return this.session(
      reply,
      await this.access.changePassword(body, proof(request)),
    );
  }
  @Get("staff")
  @AccessEntry("administrator")
  list(@Req() request: AccessRequest) {
    return this.access.list(proof(request));
  }
  @Post("staff")
  @AccessEntry("administrator")
  create(@Body() body: unknown, @Req() request: AccessRequest) {
    return this.access.create(body, proof(request));
  }
  @Patch("staff/:id")
  @AccessEntry("administrator")
  patch(
    @Param("id") id: string,
    @Body() body: unknown,
    @Req() request: AccessRequest,
  ) {
    return this.access.patch(id, body, proof(request));
  }
  @Post("staff/:id/password-reset")
  @HttpCode(204)
  @AccessEntry("administrator")
  reset(
    @Param("id") id: string,
    @Body() body: unknown,
    @Req() request: AccessRequest,
  ) {
    return this.access.reset(id, body, proof(request));
  }
}
