import { AllTargets, Comments, createComments, diffComments } from "./comment";
import { Model } from "./parser";

describe("createComments", () => {
  test("empty", () => {
    // Arrange
    const models: Model[] = [];

    // Act
    const comments = createComments(models, {
      targets: AllTargets,
      ignorePattern: undefined,
      ignoreCommentPattern: undefined,
      includeEnumInFieldComment: false,
    });

    // Assert
    expect(comments).toStrictEqual({});
  });

  test("normal", () => {
    // Arrange
    const models: Model[] = [
      {
        dbName: "table1",
        documentation: "table1 comment",
        fields: [
          { dbName: "field1", documentation: "field1 comment" },
          { dbName: "field2" },
          {
            dbName: "field3",
            documentation: "field3 comment",
            typeEnum: {
              dbName: "enum1",
              name: "enum1_name",
              values: ["A", "B"],
              documentation: "enum1 comment",
            },
          },
          {
            dbName: "field4",
            typeEnum: {
              dbName: "enum2",
              name: "enum2_name",
              values: ["A", "B", "C"],
            },
          },
        ],
      },
      {
        dbName: "table2",
        fields: [{ dbName: "fieldA", documentation: "fieldA comment" }],
      },
    ];

    // Act
    const comments = createComments(models, {
      targets: AllTargets,
      ignorePattern: undefined,
      ignoreCommentPattern: undefined,
      includeEnumInFieldComment: false,
    });

    // Assert
    expect(comments).toStrictEqual({
      table1: {
        table: {
          schema: undefined,
          tableName: "table1",
          comment: "table1 comment",
        },
        columns: [
          {
            schema: undefined,
            tableName: "table1",
            columnName: "field1",
            comment: "field1 comment",
          },
          {
            schema: undefined,
            tableName: "table1",
            columnName: "field2",
            comment: "",
          },
          {
            schema: undefined,
            tableName: "table1",
            columnName: "field3",
            comment: "field3 comment",
          },
          {
            schema: undefined,
            tableName: "table1",
            columnName: "field4",
            comment: "",
          },
        ],
      },
      table2: {
        table: { schema: undefined, tableName: "table2", comment: "" },
        columns: [
          {
            schema: undefined,
            tableName: "table2",
            columnName: "fieldA",
            comment: "fieldA comment",
          },
        ],
      },
    });
  });

  test("includeEnumInFieldComment", () => {
    // Arrange
    const models: Model[] = [
      {
        dbName: "table1",
        documentation: "table1 comment",
        fields: [
          { dbName: "field1", documentation: "field1 comment" },
          { dbName: "field2" },
          {
            dbName: "field3",
            documentation: "field3 comment",
            typeEnum: {
              dbName: "enum1",
              name: "enum1_name",
              values: ["A", "B"],
              documentation: "enum1 comment",
            },
          },
          {
            dbName: "field4",
            typeEnum: {
              dbName: "enum2",
              name: "enum2_name",
              values: ["A", "B", "C"],
            },
          },
        ],
      },
    ];

    // Act
    const comments = createComments(models, {
      targets: AllTargets,
      ignorePattern: undefined,
      ignoreCommentPattern: undefined,
      includeEnumInFieldComment: true,
    });

    // Assert
    expect(comments).toStrictEqual({
      table1: {
        table: {
          schema: undefined,
          tableName: "table1",
          comment: "table1 comment",
        },
        columns: [
          {
            schema: undefined,
            tableName: "table1",
            columnName: "field1",
            comment: "field1 comment",
          },
          {
            schema: undefined,
            tableName: "table1",
            columnName: "field2",
            comment: "",
          },
          {
            schema: undefined,
            tableName: "table1",
            columnName: "field3",
            comment: "field3 comment\nenum: enum1(A, B)",
          },
          {
            schema: undefined,
            tableName: "table1",
            columnName: "field4",
            comment: "enum: enum2(A, B, C)",
          },
        ],
      },
    });
  });

  test("ignorePattern", () => {
    // Arrange
    const models: Model[] = [
      {
        dbName: "table1",
        documentation: "table1 comment",
        fields: [
          { dbName: "field1", documentation: "field1 comment" },
          { dbName: "field2" },
          {
            dbName: "field3",
            documentation: "field3 comment",
            typeEnum: {
              dbName: "enum1",
              name: "enum1_name",
              values: ["A", "B"],
              documentation: "enum1 comment",
            },
          },
          {
            dbName: "field4",
            typeEnum: {
              dbName: "enum2",
              name: "enum2_name",
              values: ["A", "B", "C"],
            },
          },
        ],
      },
      {
        dbName: "table2",
        fields: [{ dbName: "fieldA", documentation: "fieldA comment" }],
      },
    ];

    // Act
    const comments = createComments(models, {
      targets: AllTargets,
      ignorePattern: /table1/,
      ignoreCommentPattern: undefined,
      includeEnumInFieldComment: false,
    });

    // Assert
    expect(comments).toStrictEqual({
      table2: {
        table: { schema: undefined, tableName: "table2", comment: "" },
        columns: [
          {
            schema: undefined,
            tableName: "table2",
            columnName: "fieldA",
            comment: "fieldA comment",
          },
        ],
      },
    });
  });

  test("ignoreCommentPattern", () => {
    // Arrange
    const models: Model[] = [
      {
        dbName: "table1",
        documentation: "table1 comment",
        fields: [
          { dbName: "field1", documentation: "field1 comment" },
          { dbName: "field2" },
          {
            dbName: "field3",
            documentation: "field3 comment",
            typeEnum: {
              dbName: "enum1",
              name: "enum1_name",
              values: ["A", "B"],
              documentation: "enum1 comment",
            },
          },
          {
            dbName: "field4",
            typeEnum: {
              dbName: "enum2",
              name: "enum2_name",
              values: ["A", "B", "C"],
            },
          },
        ],
      },
      {
        dbName: "table2",
        documentation: "table2 comment",
        fields: [{ dbName: "fieldA", documentation: "fieldA comment" }],
      },
    ];

    // Act
    const comments = createComments(models, {
      targets: AllTargets,
      ignorePattern: undefined,
      ignoreCommentPattern: /field1|table2/,
      includeEnumInFieldComment: false,
    });

    // Assert
    expect(comments).toStrictEqual({
      table1: {
        table: {
          schema: undefined,
          tableName: "table1",
          comment: "table1 comment",
        },
        columns: [
          {
            schema: undefined,
            tableName: "table1",
            columnName: "field1",
            comment: "",
          },
          {
            schema: undefined,
            tableName: "table1",
            columnName: "field2",
            comment: "",
          },
          {
            schema: undefined,
            tableName: "table1",
            columnName: "field3",
            comment: "field3 comment",
          },
          {
            schema: undefined,
            tableName: "table1",
            columnName: "field4",
            comment: "",
          },
        ],
      },
      table2: {
        table: { schema: undefined, tableName: "table2", comment: "" },
        columns: [
          {
            schema: undefined,
            tableName: "table2",
            columnName: "fieldA",
            comment: "fieldA comment",
          },
        ],
      },
    });
  });

  test("creates comments for table target only", () => {
    // Arrange
    const models: Model[] = [
      {
        dbName: "table1",
        documentation: "table1 comment",
        fields: [
          { dbName: "field1", documentation: "field1 comment" },
          { dbName: "field2", documentation: "field2 comment" },
        ],
      },
    ];

    // Act
    const comments = createComments(models, {
      targets: ["table"],
      ignorePattern: undefined,
      ignoreCommentPattern: undefined,
      includeEnumInFieldComment: false,
    });

    // Assert
    expect(comments).toStrictEqual({
      table1: {
        table: {
          schema: undefined,
          tableName: "table1",
          comment: "table1 comment",
        },
        columns: undefined,
      },
    });
  });

  test("creates comments for column target only", () => {
    // Arrange
    const models: Model[] = [
      {
        dbName: "table1",
        documentation: "table1 comment",
        fields: [
          { dbName: "field1", documentation: "field1 comment" },
          { dbName: "field2", documentation: "field2 comment" },
        ],
      },
    ];

    // Act
    const comments = createComments(models, {
      targets: ["column"],
      ignorePattern: undefined,
      ignoreCommentPattern: undefined,
      includeEnumInFieldComment: false,
    });

    // Assert
    expect(comments).toStrictEqual({
      table1: {
        table: undefined,
        columns: [
          {
            schema: undefined,
            tableName: "table1",
            columnName: "field1",
            comment: "field1 comment",
          },
          {
            schema: undefined,
            tableName: "table1",
            columnName: "field2",
            comment: "field2 comment",
          },
        ],
      },
    });
  });

  test("combines ignorePattern and includeEnumInFieldComment", () => {
    // Arrange
    const models: Model[] = [
      {
        dbName: "ignore_table",
        documentation: "should be ignored",
        fields: [
          {
            dbName: "field1",
            documentation: "should be ignored",
            typeEnum: {
              dbName: "enum1",
              name: "enum1",
              values: ["A", "B"],
              documentation: "enum1 comment",
            },
          },
        ],
      },
      {
        dbName: "keep_table",
        documentation: "should be kept",
        fields: [
          {
            dbName: "field1",
            documentation: "should include enum",
            typeEnum: {
              dbName: "enum2",
              name: "enum2",
              values: ["X", "Y"],
              documentation: "enum2 comment",
            },
          },
        ],
      },
    ];

    // Act
    const comments = createComments(models, {
      targets: AllTargets,
      ignorePattern: /^ignore_/,
      ignoreCommentPattern: undefined,
      includeEnumInFieldComment: true,
    });

    // Assert
    expect(comments).toStrictEqual({
      keep_table: {
        table: {
          schema: undefined,
          tableName: "keep_table",
          comment: "should be kept",
        },
        columns: [
          {
            schema: undefined,
            tableName: "keep_table",
            columnName: "field1",
            comment: "should include enum\nenum: enum2(X, Y)",
          },
        ],
      },
    });
  });

  test("creates comments with schema", () => {
    // Arrange
    const models: Model[] = [
      {
        schema: "public",
        dbName: "users",
        documentation: "ユーザーテーブル",
        fields: [
          {
            dbName: "id",
            documentation: "ユーザーID",
          },
          {
            dbName: "name",
            documentation: "ユーザー名",
          },
        ],
      },
      {
        schema: "shop",
        dbName: "products",
        documentation: "商品テーブル",
        fields: [
          {
            dbName: "id",
            documentation: "商品ID",
            typeEnum: {
              dbName: "product_type",
              name: "ProductType",
              values: ["PHYSICAL", "DIGITAL"],
              documentation: "商品種別",
            },
          },
          {
            dbName: "status",
            typeEnum: {
              dbName: "product_status",
              name: "ProductStatus",
              values: ["DRAFT", "PUBLISHED"],
            },
          },
        ],
      },
    ];

    // Act
    const comments = createComments(models, {
      targets: AllTargets,
      ignorePattern: undefined,
      ignoreCommentPattern: undefined,
      includeEnumInFieldComment: true,
    });

    // Assert
    expect(comments).toStrictEqual({
      "public.users": {
        table: {
          schema: "public",
          tableName: "users",
          comment: "ユーザーテーブル",
        },
        columns: [
          {
            schema: "public",
            tableName: "users",
            columnName: "id",
            comment: "ユーザーID",
          },
          {
            schema: "public",
            tableName: "users",
            columnName: "name",
            comment: "ユーザー名",
          },
        ],
      },
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
            comment: "商品ID\nenum: product_type(PHYSICAL, DIGITAL)",
          },
          {
            schema: "shop",
            tableName: "products",
            columnName: "status",
            comment: "enum: product_status(DRAFT, PUBLISHED)",
          },
        ],
      },
    });
  });

  test("commentRemovePattern strips matched prefix", () => {
    // Arrange
    const models: Model[] = [
      {
        dbName: "table1",
        documentation: "@Description ユーザーテーブル",
        fields: [
          { dbName: "field1", documentation: "@Description ユーザーID" },
          { dbName: "field2", documentation: "通常のコメント" },
        ],
      },
    ];

    // Act
    const comments = createComments(models, {
      targets: AllTargets,
      ignorePattern: undefined,
      ignoreCommentPattern: undefined,
      commentRemovePattern: /@Description /,
      includeEnumInFieldComment: false,
    });

    // Assert
    expect(comments).toStrictEqual({
      table1: {
        table: {
          schema: undefined,
          tableName: "table1",
          comment: "ユーザーテーブル",
        },
        columns: [
          {
            schema: undefined,
            tableName: "table1",
            columnName: "field1",
            comment: "ユーザーID",
          },
          {
            schema: undefined,
            tableName: "table1",
            columnName: "field2",
            comment: "通常のコメント",
          },
        ],
      },
    });
  });

  test("commentRemovePattern strips matched portion", () => {
    // Arrange
    const models: Model[] = [
      {
        dbName: "table1",
        documentation: "ユーザーテーブル @internal",
        fields: [{ dbName: "field1", documentation: "ユーザーID @internal" }],
      },
    ];

    // Act
    const comments = createComments(models, {
      targets: AllTargets,
      ignorePattern: undefined,
      ignoreCommentPattern: undefined,
      commentRemovePattern: / @internal/,
      includeEnumInFieldComment: false,
    });

    // Assert
    expect(comments).toStrictEqual({
      table1: {
        table: {
          schema: undefined,
          tableName: "table1",
          comment: "ユーザーテーブル",
        },
        columns: [
          {
            schema: undefined,
            tableName: "table1",
            columnName: "field1",
            comment: "ユーザーID",
          },
        ],
      },
    });
  });

  test("commentRemovePattern non-match leaves comment unchanged", () => {
    // Arrange
    const models: Model[] = [
      {
        dbName: "table1",
        documentation: "通常のコメント",
        fields: [{ dbName: "field1", documentation: "フィールドコメント" }],
      },
    ];

    // Act
    const comments = createComments(models, {
      targets: AllTargets,
      ignorePattern: undefined,
      ignoreCommentPattern: undefined,
      commentRemovePattern: /@Description /,
      includeEnumInFieldComment: false,
    });

    // Assert
    expect(comments).toStrictEqual({
      table1: {
        table: {
          schema: undefined,
          tableName: "table1",
          comment: "通常のコメント",
        },
        columns: [
          {
            schema: undefined,
            tableName: "table1",
            columnName: "field1",
            comment: "フィールドコメント",
          },
        ],
      },
    });
  });

  test("commentRemovePattern removes first line of multiline comment", () => {
    // Arrange
    const models: Model[] = [
      {
        dbName: "table1",
        fields: [
          {
            dbName: "userId",
            documentation: "@prismabox.options{max: 10}\nthis is the user id",
          },
          {
            dbName: "name",
            documentation: "@prismabox.hide\nthis is the name",
          },
        ],
      },
    ];

    // Act
    const comments = createComments(models, {
      targets: AllTargets,
      ignorePattern: undefined,
      ignoreCommentPattern: undefined,
      commentRemovePattern: /^@prismabox\.[^\n]+\n/,
      includeEnumInFieldComment: false,
    });

    // Assert
    expect(comments).toStrictEqual({
      table1: {
        table: {
          schema: undefined,
          tableName: "table1",
          comment: "",
        },
        columns: [
          {
            schema: undefined,
            tableName: "table1",
            columnName: "userId",
            comment: "this is the user id",
          },
          {
            schema: undefined,
            tableName: "table1",
            columnName: "name",
            comment: "this is the name",
          },
        ],
      },
    });
  });

  test("commentRemovePattern removes second line of multiline comment", () => {
    // Arrange
    const models: Model[] = [
      {
        dbName: "table1",
        fields: [
          {
            dbName: "userId",
            documentation: "this is the user id\n@prismabox.options{max: 10}",
          },
          {
            dbName: "name",
            documentation: "this is the name\n@prismabox.hide",
          },
        ],
      },
    ];

    // Act
    const comments = createComments(models, {
      targets: AllTargets,
      ignorePattern: undefined,
      ignoreCommentPattern: undefined,
      commentRemovePattern: /\n@prismabox\.[^\n]+/,
      includeEnumInFieldComment: false,
    });

    // Assert
    expect(comments).toStrictEqual({
      table1: {
        table: {
          schema: undefined,
          tableName: "table1",
          comment: "",
        },
        columns: [
          {
            schema: undefined,
            tableName: "table1",
            columnName: "userId",
            comment: "this is the user id",
          },
          {
            schema: undefined,
            tableName: "table1",
            columnName: "name",
            comment: "this is the name",
          },
        ],
      },
    });
  });

  test("commentTransformFn transforms comments with context", () => {
    // Arrange
    const models: Model[] = [
      {
        dbName: "users",
        documentation: "table: users comment",
        fields: [{ dbName: "id", documentation: "column: id comment" }],
      },
    ];

    // Act
    const comments = createComments(models, {
      targets: AllTargets,
      ignorePattern: undefined,
      ignoreCommentPattern: undefined,
      includeEnumInFieldComment: false,
      commentTransformFn: (comment, context) => `[${context.type}] ${comment}`,
    });

    // Assert
    expect(comments).toStrictEqual({
      users: {
        table: {
          schema: undefined,
          tableName: "users",
          comment: "[table] table: users comment",
        },
        columns: [
          {
            schema: undefined,
            tableName: "users",
            columnName: "id",
            comment: "[column] column: id comment",
          },
        ],
      },
    });
  });

  test("commentTransformFn receives correct context fields", () => {
    // Arrange
    const models: Model[] = [
      {
        schema: "myschema",
        dbName: "users",
        documentation: "table comment",
        fields: [{ dbName: "email", documentation: "field comment" }],
      },
    ];

    const capturedContexts: {
      comment: string;
      type: string;
      tableName: string;
      columnName?: string;
      schema?: string;
    }[] = [];

    // Act
    createComments(models, {
      targets: AllTargets,
      ignorePattern: undefined,
      ignoreCommentPattern: undefined,
      includeEnumInFieldComment: false,
      commentTransformFn: (comment, context) => {
        capturedContexts.push({ comment, ...context });
        return comment;
      },
    });

    // Assert
    expect(capturedContexts).toEqual([
      {
        comment: "table comment",
        type: "table",
        tableName: "users",
        schema: "myschema",
      },
      {
        comment: "field comment",
        type: "column",
        tableName: "users",
        columnName: "email",
        schema: "myschema",
      },
    ]);
  });

  test("commentRemovePattern and commentTransformFn applied in sequence", () => {
    // Arrange
    const models: Model[] = [
      {
        dbName: "table1",
        documentation: "@Description テーブルコメント",
        fields: [
          {
            dbName: "field1",
            documentation: "@Description フィールドコメント",
          },
        ],
      },
    ];

    // Act
    const comments = createComments(models, {
      targets: AllTargets,
      ignorePattern: undefined,
      ignoreCommentPattern: undefined,
      commentRemovePattern: /@Description /,
      includeEnumInFieldComment: false,
      commentTransformFn: (comment) => comment.toUpperCase(),
    });

    // Assert
    expect(comments).toStrictEqual({
      table1: {
        table: {
          schema: undefined,
          tableName: "table1",
          comment: "テーブルコメント".toUpperCase(),
        },
        columns: [
          {
            schema: undefined,
            tableName: "table1",
            columnName: "field1",
            comment: "フィールドコメント".toUpperCase(),
          },
        ],
      },
    });
  });

  test("commentTransformFn is not called for undefined documentation", () => {
    // Arrange
    const models: Model[] = [
      {
        dbName: "table1",
        fields: [{ dbName: "field1" }],
      },
    ];

    const fnCallCount = { count: 0 };

    // Act
    const comments = createComments(models, {
      targets: AllTargets,
      ignorePattern: undefined,
      ignoreCommentPattern: undefined,
      includeEnumInFieldComment: false,
      commentTransformFn: () => {
        fnCallCount.count++;
        return "transformed";
      },
    });

    // Assert
    expect(fnCallCount.count).toBe(0);
    expect(comments.table1.table?.comment).toBe("");
    expect(comments.table1.columns?.[0].comment).toBe("");
  });
});

describe("diffComments", () => {
  test("empty", () => {
    // Arrange
    const first: Comments = {};
    const second: Comments = {};

    // Act
    const comments = diffComments(first, second);

    // Assert
    expect(comments).toStrictEqual({});
  });

  test("empty second", () => {
    // Arrange
    const first: Comments = {
      table1: {
        table: { tableName: "table1", comment: "table1 comment" },
        columns: [
          {
            tableName: "table1",
            columnName: "field1",
            comment: "field1 comment",
          },
          { tableName: "table1", columnName: "field2", comment: "" },
          {
            tableName: "table1",
            columnName: "field3",
            comment: "field3 comment",
          },
          { tableName: "table1", columnName: "field4", comment: "" },
        ],
      },
      table2: {
        table: { tableName: "table2", comment: "" },
        columns: [
          {
            tableName: "table2",
            columnName: "fieldA",
            comment: "fieldA comment",
          },
        ],
      },
    };
    const second: Comments = {};

    // Act
    const comments = diffComments(first, second);

    // Assert
    expect(comments).toStrictEqual({
      table1: {
        table: { tableName: "table1", comment: "table1 comment" },
        columns: [
          {
            tableName: "table1",
            columnName: "field1",
            comment: "field1 comment",
          },
          {
            tableName: "table1",
            columnName: "field3",
            comment: "field3 comment",
          },
        ],
      },
      table2: {
        table: undefined,
        columns: [
          {
            tableName: "table2",
            columnName: "fieldA",
            comment: "fieldA comment",
          },
        ],
      },
    });
  });

  test("first has columns only", () => {
    // Arrange
    const first: Comments = {
      table1: {
        table: undefined,
        columns: [
          {
            tableName: "table1",
            columnName: "field1",
            comment: "field1 comment",
          },
        ],
      },
    };
    const second: Comments = {};

    // Act
    const comments = diffComments(first, second);

    // Assert
    expect(comments).toStrictEqual({
      table1: {
        table: undefined,
        columns: [
          {
            tableName: "table1",
            columnName: "field1",
            comment: "field1 comment",
          },
        ],
      },
    });
  });

  test("empty first", () => {
    // Arrange
    const first: Comments = {};
    const second: Comments = {
      table1: {
        table: { tableName: "table1", comment: "table1 comment" },
        columns: [
          {
            tableName: "table1",
            columnName: "field1",
            comment: "field1 comment",
          },
          { tableName: "table1", columnName: "field2", comment: "" },
          {
            tableName: "table1",
            columnName: "field3",
            comment: "field3 comment",
          },
          { tableName: "table1", columnName: "field4", comment: "" },
        ],
      },
      table2: {
        table: { tableName: "table2", comment: "" },
        columns: [
          {
            tableName: "table2",
            columnName: "fieldA",
            comment: "fieldA comment",
          },
        ],
      },
    };

    // Act
    const comments = diffComments(first, second);

    // Assert
    expect(comments).toStrictEqual({});
  });

  test("same", () => {
    // Arrange
    const first: Comments = {
      table1: {
        table: { tableName: "table1", comment: "table1 comment" },
        columns: [
          {
            tableName: "table1",
            columnName: "field1",
            comment: "field1 comment",
          },
          { tableName: "table1", columnName: "field2", comment: "" },
          {
            tableName: "table1",
            columnName: "field3",
            comment: "field3 comment",
          },
          { tableName: "table1", columnName: "field4", comment: "" },
        ],
      },
      table2: {
        table: { tableName: "table2", comment: "" },
        columns: [
          {
            tableName: "table2",
            columnName: "fieldA",
            comment: "fieldA comment",
          },
        ],
      },
    };
    const second: Comments = {
      table1: {
        table: { tableName: "table1", comment: "table1 comment" },
        columns: [
          {
            tableName: "table1",
            columnName: "field1",
            comment: "field1 comment",
          },
          { tableName: "table1", columnName: "field2", comment: "" },
          {
            tableName: "table1",
            columnName: "field3",
            comment: "field3 comment",
          },
          { tableName: "table1", columnName: "field4", comment: "" },
        ],
      },
      table2: {
        table: { tableName: "table2", comment: "" },
        columns: [
          {
            tableName: "table2",
            columnName: "fieldA",
            comment: "fieldA comment",
          },
        ],
      },
    };

    // Act
    const comments = diffComments(first, second);

    // Assert
    expect(comments).toStrictEqual({});
  });

  test("diff", () => {
    // Arrange
    const first: Comments = {
      table1: {
        table: {
          schema: undefined,
          tableName: "table1",
          comment: "table1 comment",
        },
        columns: [
          {
            schema: undefined,
            tableName: "table1",
            columnName: "field1",
            comment: "field1 comment xxx",
          },
          {
            schema: undefined,
            tableName: "table1",
            columnName: "field2",
            comment: "xxx",
          },
          {
            schema: undefined,
            tableName: "table1",
            columnName: "field3",
            comment: "",
          },
          {
            schema: undefined,
            tableName: "table1",
            columnName: "field4",
            comment: "",
          },
        ],
      },
      table2: {
        table: { schema: undefined, tableName: "table2", comment: "xxx" },
        columns: [
          {
            schema: undefined,
            tableName: "table2",
            columnName: "fieldA",
            comment: "fieldA comment",
          },
        ],
      },
    };
    const second: Comments = {
      table1: {
        table: { tableName: "table1", comment: "table1 comment" },
        columns: [
          {
            tableName: "table1",
            columnName: "field1",
            comment: "field1 comment",
          },
          { tableName: "table1", columnName: "field2", comment: "" },
          {
            tableName: "table1",
            columnName: "field3",
            comment: "field3 comment",
          },
          { tableName: "table1", columnName: "field4", comment: "" },
        ],
      },
      table2: {
        table: { tableName: "table2", comment: "" },
        columns: [
          {
            tableName: "table2",
            columnName: "fieldA",
            comment: "fieldA comment",
          },
        ],
      },
    };

    // Act
    const comments = diffComments(first, second);

    // Assert
    expect(comments).toStrictEqual({
      table1: {
        table: undefined,
        columns: [
          {
            schema: undefined,
            tableName: "table1",
            columnName: "field1",
            comment: "field1 comment xxx",
          },
          {
            schema: undefined,
            tableName: "table1",
            columnName: "field2",
            comment: "xxx",
          },
          {
            schema: undefined,
            tableName: "table1",
            columnName: "field3",
            comment: "",
          },
        ],
      },
      table2: {
        table: { schema: undefined, tableName: "table2", comment: "xxx" },
        columns: [],
      },
    });
  });

  test("handles new columns in first comments", () => {
    // Arrange
    const first: Comments = {
      table1: {
        table: {
          schema: undefined,
          tableName: "table1",
          comment: "table1 comment",
        },
        columns: [
          {
            schema: undefined,
            tableName: "table1",
            columnName: "field1",
            comment: "field1 comment",
          },
          {
            schema: undefined,
            tableName: "table1",
            columnName: "new_field",
            comment: "new field comment",
          },
        ],
      },
    };
    const second: Comments = {
      table1: {
        table: { tableName: "table1", comment: "table1 comment" },
        columns: [
          {
            tableName: "table1",
            columnName: "field1",
            comment: "field1 comment",
          },
        ],
      },
    };

    // Act
    const comments = diffComments(first, second);

    // Assert
    expect(comments).toStrictEqual({
      table1: {
        table: undefined,
        columns: [
          {
            schema: undefined,
            tableName: "table1",
            columnName: "new_field",
            comment: "new field comment",
          },
        ],
      },
    });
  });

  test("detects only changed column comments", () => {
    // Arrange
    const first: Comments = {
      table1: {
        table: {
          schema: undefined,
          tableName: "table1",
          comment: "table1 comment",
        },
        columns: [
          {
            schema: undefined,
            tableName: "table1",
            columnName: "field1",
            comment: "field1 comment updated",
          },
          {
            schema: undefined,
            tableName: "table1",
            columnName: "field2",
            comment: "field2 unchanged",
          },
        ],
      },
    };
    const second: Comments = {
      table1: {
        table: {
          schema: undefined,
          tableName: "table1",
          comment: "table1 comment",
        },
        columns: [
          {
            schema: undefined,
            tableName: "table1",
            columnName: "field1",
            comment: "field1 comment",
          },
          {
            schema: undefined,
            tableName: "table1",
            columnName: "field2",
            comment: "field2 unchanged",
          },
        ],
      },
    };

    // Act
    const comments = diffComments(first, second);

    // Assert
    expect(comments).toStrictEqual({
      table1: {
        table: undefined,
        columns: [
          {
            schema: undefined,
            tableName: "table1",
            columnName: "field1",
            comment: "field1 comment updated",
          },
        ],
      },
    });
  });
});
