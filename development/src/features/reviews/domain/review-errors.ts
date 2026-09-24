import { AppError } from "@/server/lib/errors/domain-errors";

export class ReviewDuplicateError extends AppError {
  constructor() { super("La review ya existe", "review_duplicate", 409); }
}

export class ReviewCategoryError extends AppError {
  constructor() { super("Categoría de review no permitida", "review_category_invalid", 400); }
}
