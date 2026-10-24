import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpException,
  Param,
  Post,
  Put,
  Req,
  Query,
  UseFilters,
  ServiceUnavailableException,
} from "@nestjs/common";
import { HttpContract } from "../../../infrastructure/http/http-contract.decorator.js";
import { DtoValidationPipe } from "../../../infrastructure/http/dto-validation.pipe.js";
import { EmptyQueryDto } from "../../../infrastructure/http/empty-query.dto.js";
import type { Offering } from "../domain/catalogue.js";
import { AccessService } from "../../authentication/public.js";
import {
  AccessEntry,
  proof,
  type AccessRequest,
} from "../../authentication/http/public.js";
import { MenuListExceptionFilter } from "./menu-list-exception.filter.js";
import { MenuService } from "../application/menu.service.js";
import { menuErrorStatus } from "./menu-error-mapping.js";
import { MenuError } from "../domain/catalogue.js";

@Controller("api/v1/menu")
export class MenuController {
  constructor(
    private readonly menu: MenuService,
    private readonly access: AccessService,
  ) {}
  private async boundary<T>(work: () => Promise<T>): Promise<T> {
    try {
      return await work();
    } catch (error) {
      if (error instanceof MenuError)
        throw new HttpException(
          { statusCode: menuErrorStatus(error.reason) },
          menuErrorStatus(error.reason),
        );
      throw error;
    }
  }
  private async context(request: AccessRequest) {
    const context = await this.access.me(proof(request), true);
    if (!("business" in context)) throw new ServiceUnavailableException();
    return context;
  }
  @Get("offerings")
  @AccessEntry("staff")
  @HttpContract()
  @UseFilters(MenuListExceptionFilter)
  async list(
    @Req() request: AccessRequest,
    @Query(new DtoValidationPipe("query"))
    _query: EmptyQueryDto,
  ): Promise<Offering[]> {
    return this.menu.list(await this.context(request));
  }
  @Get("offerings/:id")
  @AccessEntry("staff")
  get(@Req() request: AccessRequest, @Param("id") id: string) {
    return this.boundary(async () =>
      this.menu.get(await this.context(request), id),
    );
  }
  @Get("definitions")
  @AccessEntry("administrator")
  definitions(@Req() request: AccessRequest) {
    return this.boundary(async () =>
      this.menu.list(await this.context(request), true),
    );
  }
  @Get("definitions/:id")
  @AccessEntry("administrator")
  definition(@Req() request: AccessRequest, @Param("id") id: string) {
    return this.boundary(async () =>
      this.menu.get(await this.context(request), id, true),
    );
  }
  @Post("offerings")
  @AccessEntry("administrator")
  create(@Req() request: AccessRequest, @Body() body: unknown) {
    return this.boundary(() =>
      this.access.runAuthorized(proof(request), "administrator", (scope) =>
        this.menu.save(scope, body),
      ),
    );
  }
  @Put("offerings/:id")
  @AccessEntry("administrator")
  update(
    @Req() request: AccessRequest,
    @Param("id") id: string,
    @Body() body: unknown,
  ) {
    return this.boundary(() =>
      this.access.runAuthorized(proof(request), "administrator", (scope) =>
        this.menu.save(scope, body, id),
      ),
    );
  }
  @Post("offerings/:id/deactivate")
  @HttpCode(200)
  @AccessEntry("administrator")
  deactivate(
    @Req() request: AccessRequest,
    @Param("id") id: string,
    @Body() body: unknown,
  ) {
    return this.boundary(() =>
      this.access.runAuthorized(proof(request), "administrator", (scope) =>
        this.menu.deactivate(scope, id, body),
      ),
    );
  }
  @Post("resolve")
  @HttpCode(200)
  @AccessEntry("staff")
  resolve(@Req() request: AccessRequest, @Body() body: unknown) {
    return this.boundary(() =>
      this.access.runAuthorized(proof(request), "staff", (scope) =>
        this.menu.resolve(scope, body),
      ),
    );
  }
}
