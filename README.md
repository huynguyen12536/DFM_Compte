# COMPTE Frontend

Frontend foundation for COMPTE, a business management SaaS.

## Stack

- Next.js App Router, React, TypeScript (strict)
- Tailwind CSS and shadcn/ui configuration
- TanStack Query, React Hook Form, Zod
- next-intl foundation dependency
- date-fns, Lucide React
- ESLint and Prettier

## Development

```bash
npm install
copy .env.example .env.local
npm run dev
```

## Checks

```bash
npm run lint
npm run typecheck
npm run format:check
npm run build
```

This repository currently contains foundation only. Business features, authentication, API services, and application UI are intentionally not implemented.
