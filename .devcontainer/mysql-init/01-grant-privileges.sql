-- Grant required privileges to db_user for Prisma shadow database
-- Based on: https://www.prisma.io/docs/orm/prisma-migrate/understanding-prisma-migrate/shadow-database#shadow-database-user-permissions
GRANT CREATE, ALTER, DROP, REFERENCES, CREATE ROUTINE, ALTER ROUTINE ON *.* TO 'db_user'@'%';
FLUSH PRIVILEGES;