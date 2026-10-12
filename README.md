<div align="center">
  <img src="public/icons/bosha-symbol.svg" alt="Bosha Studio logo" width="90" />

  <h1>ER Diagram — Bosha Studio</h1>

  <p><strong>From ideas to structured database designs.</strong></p>
  <p>A modern, browser-based workspace for creating, organizing, validating, and exporting entity–relationship diagrams.</p>

  <p>
    <a href="https://er-diagram.r3dzf-studio.workers.dev"><strong>🚀 Launch Live Editor</strong></a>
    ·
    <a href="#-features"><strong>Explore Features</strong></a>
    ·
    <a href="#-getting-started"><strong>Get Started</strong></a>
    ·
    <a href="https://github.com/R3Dzf/ER_Diagram/issues"><strong>Report an Issue</strong></a>
  </p>

  <p>
    <a href="https://github.com/R3Dzf/ER_Diagram/actions/workflows/ci.yml">
      <img alt="Build and tests" src="https://github.com/R3Dzf/ER_Diagram/actions/workflows/ci.yml/badge.svg?branch=main" />
    </a>
    <img alt="Chen and Crow's Foot supported" src="https://img.shields.io/badge/Notations-Chen%20%26%20Crow%27s%20Foot-496dba" />
    <img alt="Runs in the browser" src="https://img.shields.io/badge/Platform-Web-208778" />
    <a href="https://github.com/R3Dzf/ER_Diagram/stargazers">
      <img alt="GitHub stars" src="https://img.shields.io/github/stars/R3Dzf/ER_Diagram?style=flat" />
    </a>
  </p>
</div>

---

## ✨ Overview

**Bosha Studio** helps students, developers, and database designers transform complex requirements into clear, editable ER diagrams.

Build with **Chen notation**, switch to **Crow's Foot**, configure relationship rules, examine your schema, and export a polished result—all from one workspace.

**No installation or account is needed to start drawing.**

<div align="center">
  <img src="docs/assets/customer-orders.svg" alt="Example Chen ER diagram: Customer places Order, with key attributes and one-to-many relationship" width="820" />
  <p><em>Example: a customer places orders, with explicit keys, cardinality, and participation.</em></p>
</div>

## 🌟 Features

| Feature | What you can do |
| :--- | :--- |
| **Two ER notations** | Design in **Chen** and **Crow's Foot** using a shared underlying model. |
| **Independent layouts** | Arrange each notation separately without destroying the layout of the other. |
| **Visual canvas** | Pan, zoom, multi-select, move groups, duplicate elements, and edit directly on the drawing. |
| **Modeling rules** | Define primary and partial keys, weak entities, cardinality, and **partial / total participation**. |
| **Automatic layout** | Organize connected elements with notation-specific layout engines and adjustable options. |
| **Undo & redo** | Undo drawing changes independently in each notation while keeping shared model data consistent. |
| **Diagram validation** | Detect incomplete relationships, disconnected components, missing keys, and other modeling issues. |
| **SQL generation** | Review database schemas and generate SQL for **PostgreSQL, MySQL, and SQLite**. |
| **Professional exports** | Download **PNG, SVG, vector PDF**, or editable **JSON** backups. |
| **Workspace dashboard** | Manage projects with search, filters, sorting, templates, and grid/list views. |
| **Themes & offline support** | Work in light or dark mode and use the installable offline-friendly editor. |
| **Account workspaces** | Save projects across devices, review history, share, and collaborate when sign-in is configured. |

### 🧩 Designed for real database modeling

- **Entities & attributes:** create strong and weak entities; mark key, composite, derived, and multivalued attributes.
- **Relationships:** model one-to-one, one-to-many, many-to-many, recursive, and multi-participant relationships.
- **Participation:** control cardinality and mandatory/optional participation **per connected entity**.
- **Crow's Foot view:** inspect table-style entities, attribute rows, endpoint markers, and association representations.
- **Schema review:** inspect tables and relationships before downloading SQL.

> **Important:** SQL generation helps translate a conceptual model into a starting schema. Always review the mapping assumptions, constraints, and dialect-specific output before running it against a database.

## 🖼️ The editing workflow

| Step | Action | Result |
| :---: | --- | --- |
| **01** | **Create** a blank diagram or start from a template | A fresh workspace for your model |
| **02** | **Add** entities, attributes, and relationships | A visual representation of your data |
| **03** | **Configure** keys, cardinality, and participation | Clear modeling rules |
| **04** | **Arrange** your diagram or switch notation | Readable Chen and Crow's Foot layouts |
| **05** | **Validate** and preview the generated schema | Catch problems before implementation |
| **06** | **Export** as an image, PDF, SQL, or JSON | Share, present, implement, or continue editing |

## 🚀 Try it now

### [**Open the live ER Diagram editor →**](https://er-diagram.r3dzf-studio.workers.dev)

Start with a blank canvas or one of the built-in templates. Guest projects remain on **the browser/device where they were created**.

For portable backups, export your project as **JSON**. Account-based cloud sync and collaboration require Google sign-in to be configured for the deployment; those features may not be available to every visitor yet.

## 🛠️ Technology

| Layer | Technologies |
| --- | --- |
| **Interface** | JavaScript, TypeScript, React, HTML, CSS, SVG |
| **App & build** | Vinext, Vite, Node.js |
| **Backend** | Cloudflare Workers |
| **Database** | Cloudflare D1 (SQLite), Drizzle ORM |
| **Exports** | SVG, PNG, PDF, JSON, SQL |
| **Testing** | Node.js test runner, TypeScript checks, GitHub Actions |

## 💻 Getting started

### Prerequisites

- **Node.js 22.13+**
- **pnpm 11.25.0** (the version specified by the project)

### Run locally

```bash
git clone https://github.com/R3Dzf/ER_Diagram.git
cd ER_Diagram

corepack enable
corepack pnpm install --frozen-lockfile
corepack pnpm db:migrate:local
corepack pnpm dev
```

Open **http://localhost:5173/studio/** to use the development editor.

> The development server uses its own local configuration and database. A live, account-enabled deployment requires separate authentication and database setup.

### Run checks

```bash
corepack pnpm test
corepack pnpm typecheck
corepack pnpm build
```

For advanced setup, see the [development guide](docs/DEVELOPMENT.md) and [database documentation](docs/DATABASE.md).

## ☁️ Deployment

The public demo is hosted on **Cloudflare Workers** with a dedicated **Cloudflare D1** database.

- **Live demo:** https://er-diagram.r3dzf-studio.workers.dev
- **Source code:** [`main`](https://github.com/R3Dzf/ER_Diagram/tree/main)
- **Hosting instructions:** [Independent Cloudflare deployment guide](https://github.com/R3Dzf/ER_Diagram/blob/main/docs/INDEPENDENT_HOSTING.md)

The deployment is isolated from other environments. Saved accounts and projects are not automatically shared between different installations.

## 🤝 Contributing

Have an idea, found a bug, or want to improve the editor?

1. Check the [open issues](https://github.com/R3Dzf/ER_Diagram/issues) or create one with clear reproduction steps.
2. Create a focused branch for your change.
3. Add or update tests when behavior changes.
4. Open a pull request describing what changed and how you verified it.

Ideas for improvements, accessibility feedback, modeling examples, and reproducible bug reports are all appreciated.

## 📚 Documentation

[User Guide](docs/USER_GUIDE.md) · [Development](docs/DEVELOPMENT.md) · [Database](docs/DATABASE.md) · [SQL Generation](docs/SQL_GENERATION.md) · [Roadmap](docs/ROADMAP.md)

---

<div align="center">
  <strong>Make your data model make sense.</strong>
  <p>Built for curious minds, thoughtful designers, and the next great database.</p>
  <p>
    <a href="https://er-diagram.r3dzf-studio.workers.dev">Try Bosha Studio</a>
    ·
    <a href="https://github.com/R3Dzf/ER_Diagram">View Source</a>
    ·
    <a href="https://github.com/R3Dzf/ER_Diagram/stargazers">Star the Project ⭐</a>
  </p>
</div>
