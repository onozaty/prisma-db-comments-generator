import { Comments } from "./comment";
import { generateCommentStatements } from "./statement";

describe("generateCommentStatements", () => {
  test("empty comments", () => {
    // Arrange
    const comments: Comments = {};

    // Act
    const statements = generateCommentStatements(comments);

    // Assert
    expect(statements).toStrictEqual([]);
  });

  test("only table comment", () => {
    // Arrange
    const comments: Comments = {
      users: {
        table: {
          schema: undefined,
          tableName: "users",
          comment: "ユーザーテーブル",
        },
        columns: [],
      },
    };

    // Act
    const statements = generateCommentStatements(comments);

    // Assert
    expect(statements).toStrictEqual([
      "-- users comments",
      `COMMENT ON TABLE "users" IS 'ユーザーテーブル';`,
      "",
    ]);
  });

  test("only column comments", () => {
    // Arrange
    const comments: Comments = {
      users: {
        table: undefined,
        columns: [
          {
            schema: undefined,
            tableName: "users",
            columnName: "id",
            comment: "ユーザーID",
          },
          {
            schema: undefined,
            tableName: "users",
            columnName: "name",
            comment: "ユーザー名",
          },
        ],
      },
    };

    // Act
    const statements = generateCommentStatements(comments);

    // Assert
    expect(statements).toStrictEqual([
      "-- users comments",
      `COMMENT ON COLUMN "users"."id" IS 'ユーザーID';`,
      `COMMENT ON COLUMN "users"."name" IS 'ユーザー名';`,
      "",
    ]);
  });

  test("both table and column comments", () => {
    // Arrange
    const comments: Comments = {
      users: {
        table: {
          schema: undefined,
          tableName: "users",
          comment: "ユーザーテーブル",
        },
        columns: [
          {
            schema: undefined,
            tableName: "users",
            columnName: "id",
            comment: "ユーザーID",
          },
          {
            schema: undefined,
            tableName: "users",
            columnName: "name",
            comment: "ユーザー名",
          },
        ],
      },
    };

    // Act
    const statements = generateCommentStatements(comments);

    // Assert
    expect(statements).toStrictEqual([
      "-- users comments",
      `COMMENT ON TABLE "users" IS 'ユーザーテーブル';`,
      `COMMENT ON COLUMN "users"."id" IS 'ユーザーID';`,
      `COMMENT ON COLUMN "users"."name" IS 'ユーザー名';`,
      "",
    ]);
  });

  test("multiple tables", () => {
    // Arrange
    const comments: Comments = {
      users: {
        table: {
          schema: undefined,
          tableName: "users",
          comment: "ユーザーテーブル",
        },
        columns: [
          {
            schema: undefined,
            tableName: "users",
            columnName: "id",
            comment: "ユーザーID",
          },
        ],
      },
      posts: {
        table: {
          schema: undefined,
          tableName: "posts",
          comment: "投稿テーブル",
        },
        columns: [
          {
            schema: undefined,
            tableName: "posts",
            columnName: "title",
            comment: "タイトル",
          },
        ],
      },
    };

    // Act
    const statements = generateCommentStatements(comments);

    // Assert
    expect(statements).toStrictEqual([
      "-- users comments",
      `COMMENT ON TABLE "users" IS 'ユーザーテーブル';`,
      `COMMENT ON COLUMN "users"."id" IS 'ユーザーID';`,
      "",
      "-- posts comments",
      `COMMENT ON TABLE "posts" IS '投稿テーブル';`,
      `COMMENT ON COLUMN "posts"."title" IS 'タイトル';`,
      "",
    ]);
  });

  test("comments with special characters", () => {
    // Arrange
    const comments: Comments = {
      users: {
        table: {
          schema: undefined,
          tableName: "users",
          comment: "User's table",
        },
        columns: [
          {
            schema: undefined,
            tableName: "users",
            columnName: "description",
            comment: "Line1\nLine2",
          },
        ],
      },
    };

    // Act
    const statements = generateCommentStatements(comments);

    // Assert
    expect(statements).toStrictEqual([
      "-- users comments",
      `COMMENT ON TABLE "users" IS 'User''s table';`,
      `COMMENT ON COLUMN "users"."description" IS E'Line1\\nLine2';`,
      "",
    ]);
  });

  test("treat empty comments as NULL", () => {
    // Arrange
    const comments: Comments = {
      users: {
        table: {
          schema: undefined,
          tableName: "users",
          comment: "",
        },
        columns: [
          {
            schema: undefined,
            tableName: "users",
            columnName: "id",
            comment: "",
          },
        ],
      },
    };

    // Act
    const statements = generateCommentStatements(comments);

    // Assert
    expect(statements).toStrictEqual([
      "-- users comments",
      `COMMENT ON TABLE "users" IS NULL;`,
      `COMMENT ON COLUMN "users"."id" IS NULL;`,
      "",
    ]);
  });

  test("comments with schema", () => {
    // Arrange
    const comments: Comments = {
      "shop.products": {
        table: {
          schema: "shop",
          tableName: "products",
          comment: "商品テーブル",
        },
        columns: [
          {
            schema: "shop",
            tableName: "products",
            columnName: "id",
            comment: "商品ID",
          },
          {
            schema: "shop",
            tableName: "products",
            columnName: "name",
            comment: "商品名",
          },
        ],
      },
    };

    // Act
    const statements = generateCommentStatements(comments);

    // Assert
    expect(statements).toStrictEqual([
      "-- shop.products comments",
      `COMMENT ON TABLE "shop"."products" IS '商品テーブル';`,
      `COMMENT ON COLUMN "shop"."products"."id" IS '商品ID';`,
      `COMMENT ON COLUMN "shop"."products"."name" IS '商品名';`,
      "",
    ]);
  });
});
