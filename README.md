# prisma-db-comments-generator

[![Test](https://github.com/onozaty/prisma-db-comments-generator/actions/workflows/test.yml/badge.svg)](https://github.com/onozaty/prisma-db-comments-generator/actions/workflows/test.yml)
[![codecov](https://codecov.io/gh/onozaty/prisma-db-comments-generator/graph/badge.svg?token=406L0D8MI0)](https://codecov.io/gh/onozaty/prisma-db-comments-generator)
[![npm version](https://badge.fury.io/js/@onozaty%2Fprisma-db-comments-generator.svg)](https://badge.fury.io/js/@onozaty%2Fprisma-db-comments-generator)

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

| Option | Description |
|---|---|
| [targets](#targets) | Select targets for comment generation (`table`, `column`) |
| [ignorePattern](#ignorepattern) | Exclude models by database name |
| [ignoreCommentPattern](#ignorecommentpattern) | Exclude comments by content |
| [commentRemovePattern](#commentremovepattern) | Remove matching text from comments |
| [commentTransformScript](#commenttransformscript) | Transform comments with a script |
| [includeEnumInFieldComment](#includeenuminfieldcomment) | Add enum values to field comments |

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

### commentRemovePattern

Specify a regular expression with `commentRemovePattern` to remove matching text from comments.

This is useful when combining with other Prisma generators that use annotations in triple-slash comments.
For example, [prismabox](https://github.com/m1212e/prismabox) uses annotations like `@prismabox.hide` or `@prismabox.options{ min: 10, max: 20 }` in comments. Since Prisma concatenates multiple `///` comments with `\n`, you need to include the newline in the pattern.

The following pattern removes any line starting with `@prismabox.`, covering all prismabox annotations.

```prisma
generator comments {
  provider             = "prisma-db-comments-generator"
  commentRemovePattern = "^@prismabox\\.[^\\n]+\\n"
}
```

With the following definition,

```prisma
model User {
  /// @prismabox.options{max: 10}
  /// this is the user id
  userId Int @map("user_id")

  @@map("users")
}
```

The following comment is generated (annotation line is removed).

```sql
COMMENT ON COLUMN "users"."user_id" IS 'this is the user id';
```

### commentTransformScript

Specify the path to a JavaScript/TypeScript script with `commentTransformScript` to transform comments.
The path is relative to the `schema.prisma` file.

The script must export a function as its default export with the following signature:

```ts
(comment: string, context: CommentTransformContext) => string
```

`CommentTransformContext` has the following properties:

| Property | Type | Description |
|---|---|---|
| `type` | `"table"` \| `"column"` | Whether the comment is for a table or column |
| `tableName` | `string` | The database table name |
| `columnName` | `string` \| `undefined` | The database column name (only for columns) |
| `schema` | `string` \| `undefined` | The database schema name |

```prisma
generator comments {
  provider               = "prisma-db-comments-generator"
  commentTransformScript = "./comment-transform.js"
}
```

Example `comment-transform.js`:

```js
export default (comment, context) => {
  if (context.type === "table") {
    return `[TABLE] ${comment}`;
  }
  return comment;
};
```

If both `commentRemovePattern` and `commentTransformScript` are specified, `commentRemovePattern` is applied first, then `commentTransformScript`.

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
- MySQL (Experimental)

### MySQL Support (Experimental)

MySQL support is currently experimental and we are seeking feedback. For MySQL, this generator uses stored procedures to manage column comments due to MySQL's specific syntax requirements for column comment updates.

**Why Stored Procedures are Used:**
MySQL requires the full column definition when updating column comments via `ALTER TABLE ... MODIFY COLUMN`. To handle this complexity, the generator creates a stored procedure (`prisma_update_column_comment`) that dynamically retrieves the current column definition from `information_schema` and safely applies the comment update.

**Required MySQL Permissions:**
- `CREATE ROUTINE` - Required to create stored procedures for column comments
- `ALTER ROUTINE` - Required to modify stored procedures if needed

The generated SQL includes:
- Direct `ALTER TABLE` statements for table comments
- Stored procedures for column comment updates (automatically created and cleaned up)

Other databases may be available, but the above are the only ones tested.

## License

MIT

## Author

[onozaty](https://github.com/onozaty)
