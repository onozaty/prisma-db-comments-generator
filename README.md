# prisma-db-comments-generator

Generate database comments from Prisma schema.

It is based on the following code idea. Thank you @Jyrno42 .

- https://github.com/prisma/prisma/issues/8703#issuecomment-1614360386

## Features

- Create a migration SQL for the `COMMENT ON` statement based on the information in the `schema.prisma` file.
    - Comments written with triple slashes (`///`) are eligible.
- Create a `COMMENT ON` statement only for the part of the difference.
    - The previous information is stored as `prisma/migrations/comments-latest.json`.
- Support for table and column comments.
- Comments you do not want to create can be excluded using regular expressions.
    - For example, a VIEW is to be created manually, and you do not want to create a comment statement from the `schema.prisma`. In such cases, you can exclude them by specifying the pattern of the VIEW.
- Enum information can be added to column comments.

## Usage

Install this package.

```
npm install --save-dev @onozaty/prisma-db-comments-generator
```

Add the generator to the `schema.prisma`

```prisma
generator comments {
  provider = "prisma-db-comments-generator"
}
```

Run `npx prisma generate` to trigger the generator.
A SQL file for `COMMENT ON` is generated in the migrations folder.

```
$ npx prisma generate
Environment variables loaded from .env
Prisma schema loaded from prisma/schema.prisma
Comments generation completed: 20240804142142_update_comments

✔ Generated Prisma Client (v5.17.0) to ./node_modules/@prisma/client in 73ms

✔ Generated Prisma Database Comments (v1.0.1) to ./prisma/migrations in 11ms
```

## Example

For example, from the following `schema.prisma`,

```prisma
generator client {
  provider = "prisma-client-js"
}

generator comments {
  provider = "prisma-db-comments-generator"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

/// Product type enumeration
enum ProductType {
  BOOK
  TOY
  FASHION

  @@map("enum_product_type")
}

/// Customer
model Customer {
  /// Customer ID
  customerId Int      @id @default(autoincrement()) @map("customer_id")
  /// Customer Name
  name       String
  /// e-mail
  email      String   @unique
  createdAt  DateTime @default(dbgenerated("statement_timestamp()")) @map("created_at") @db.Timestamptz()
  sales      Sale[]

  @@map("customers")
}

/// Product
model Product {
  /// Product ID
  productId   Int         @id @default(autoincrement()) @map("product_id")
  /// Product Name
  name        String
  /// Product Type
  type        ProductType
  /// Product Description
  description String?
  /// Price
  price       Float
  createdAt   DateTime    @default(dbgenerated("statement_timestamp()")) @map("created_at") @db.Timestamptz()
  sales       Sale[]

  @@map("products")
}

model Sale {
  /// Sale ID
  saleId     Int      @id @default(autoincrement()) @map("sale_id")
  customer   Customer @relation(fields: [customerId], references: [customerId])
  /// Customer ID
  customerId Int      @map("customer_id")
  product    Product  @relation(fields: [productId], references: [productId])
  /// Product ID
  productId  Int      @map("product_id")
  /// Quantity
  quantity   Int
  /// Total Price
  totalPrice Float    @map("total_price")
  createdAt  DateTime @default(dbgenerated("statement_timestamp()")) @map("created_at") @db.Timestamptz()

  @@map("sales")
}
```

A migration SQL file will be generated as shown below.

```sql
-- Prisma Database Comments Generator v1.0.1

-- customers comments
COMMENT ON TABLE "customers" IS 'Customer';
COMMENT ON COLUMN "customers"."customer_id" IS 'Customer ID';
COMMENT ON COLUMN "customers"."name" IS 'Customer Name';
COMMENT ON COLUMN "customers"."email" IS 'e-mail';

-- products comments
COMMENT ON TABLE "products" IS 'Product';
COMMENT ON COLUMN "products"."product_id" IS 'Product ID';
COMMENT ON COLUMN "products"."name" IS 'Product Name';
COMMENT ON COLUMN "products"."type" IS 'Product Type';
COMMENT ON COLUMN "products"."description" IS 'Product Description';
COMMENT ON COLUMN "products"."price" IS 'Price';

-- sales comments
COMMENT ON COLUMN "sales"."sale_id" IS 'Sale ID';
COMMENT ON COLUMN "sales"."customer_id" IS 'Customer ID';
COMMENT ON COLUMN "sales"."product_id" IS 'Product ID';
COMMENT ON COLUMN "sales"."quantity" IS 'Quantity';
COMMENT ON COLUMN "sales"."total_price" IS 'Total Price';
```

## Options

### targets

You can select the target with `targets`.
The default is both `table` and `column`. (`targets = ["table", "column"]`)

For example, the following will only create comments on columns.

```prisma
generator comments {
  provider = "prisma-db-comments-generator"
  targets  = ["column"]
}
```

### ignorePattern

Specify the model to be excluded from making comments as a regular expression with `ignorePattern`.  
The name specified here is the name in the database. Therefore, if `@@map` is specified, it will be the name in `@@map`.

For example, the following is a model with `_view` as a suffix that is excluded.

```prisma
generator comments {
  provider      = "prisma-db-comments-generator"
  ignorePattern = "_view$"
}
```

### ignoreCommentPattern

Specify the model to be excluded from making comments as a regular expression with `ignoreCommentPattern`.  

For example, the following excludes comments containing `@TypeGraphQL`.

```prisma
generator comments {
  provider             = "prisma-db-comments-generator"
  ignoreCommentPattern = "@TypeGraphQL"
}
```

### includeEnumInFieldComment

If `includeEnumInFieldComment` is set to true, information about the enum is appended to the column comment.  
Default is `false`.

```prisma
generator comments {
  provider                  = "prisma-db-comments-generator"
  includeEnumInFieldComment = true
}
```

If `includeEnumInFieldComment` is set to `true` with the following definition,

```prisma
enum ProductType {
  BOOK
  TOY
  FASHION

  @@map("enum_product_type")
}

/// Product
model Product {
  /// Product Type
  type ProductType

  // others...
}
```

The following comment is generated.

```sql
COMMENT ON COLUMN "products"."type" IS E'Product Type\nenum: enum_product_type(BOOK, TOY, FASHION)';
```

## Supported Databases

- PostgreSQL

Other databases may be available, but the above is the only one checked.

## License

MIT

## Author

[onozaty](https://github.com/onozaty)
