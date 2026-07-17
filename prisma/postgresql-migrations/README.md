# PostgreSQL migration notes

`202606270001_iot_postgresql_baseline.sql` is kept as the generated PostgreSQL baseline reference.

The active Prisma migration is now:

```txt
prisma/migrations/202606280001_postgresql_baseline/migration.sql
```

The active local workflow for this project is:

```bash
npm run prisma:deploy
npm run prisma:seed
```

Legacy MySQL-oriented migrations were moved to:

```txt
prisma/legacy-mysql-migrations
```

Additional PostgreSQL-only constraints and indexes still live in `prisma/sql/postgres-hardening.sql` as an idempotent utility, but they are already included in the active baseline migration for new databases.
