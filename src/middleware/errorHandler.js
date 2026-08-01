import { StatusCodes } from "http-status-codes";
import prismaPackage from "@prisma/client";

const { Prisma } = prismaPackage;
const mapPrismaError = (err) => {
  if (!(err instanceof Prisma.PrismaClientKnownRequestError)) {
    return null;
  }

  switch (err.code) {
    case "P2002": {
      const fields = err.meta?.target;
      const fieldLabel = Array.isArray(fields) ? fields.join(", ") : "field";
      return {
        statusCode: StatusCodes.CONFLICT,
        message: `A record with this ${fieldLabel} already exists`,
      };
    }
    case "P2003":
      return {
        statusCode: StatusCodes.BAD_REQUEST,
        message: "Related record not found or constraint violated",
      };
    case "P2025":
      return {
        statusCode: StatusCodes.NOT_FOUND,
        message: "Record not found",
      };
    default:
      return null;
  }
};

const errorHandler = (err, req, res, next) => {
  const prismaError = mapPrismaError(err);
  let statusCode = prismaError?.statusCode ?? err.statusCode;
  let message = prismaError?.message ?? err.message;

  if (!statusCode) {
    statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
  }

  if (
    statusCode === StatusCodes.INTERNAL_SERVER_ERROR &&
    process.env.NODE_ENV === "production"
  ) {
    message = "Internal Server Error";
  }

  const response = {
    success: false,
    statusCode,
    message,
    ...(err.errors && err.errors.length > 0 && { errors: err.errors }),
  };

  res.status(statusCode).json(response);
};

export default errorHandler;
