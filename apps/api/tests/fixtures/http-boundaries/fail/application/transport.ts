import { HttpException as Failure } from "@nestjs/common";
import type { FastifyRequest } from "fastify";
export const failure = new Failure("Invalid input", 400);
