# How this app was built, and how the code works

A guided walkthrough written for someone who knows React/JavaScript and is learning
Python + Django. It covers three things: **what I did to create the project**, **what
every file is for**, and **how the Python and Django code actually works**.

---

## 1. What I did, step by step

Building this took five moves. Each one maps to a normal Django workflow.

1. **Created a virtual environment and installed packages.** Python projects isolate
   their dependencies in a "virtual environment" (`.venv/`) — conceptually the same role
   `node_modules` plays for Node, except you *activate* it in your shell. Into it I
   installed three packages: `Django` (the web framework), `djangorestframework` (adds
   JSON-API tooling on top of Django), and `django-cors-headers` (lets a browser app on a
   different origin call the API).

2. **Generated the project skeleton** with two commands:
   - `django-admin startproject config .` created the *project* — the global container
     (`config/settings.py`, `config/urls.py`, `manage.py`).
   - `python manage.py startapp quotes` created an *app* — a self-contained feature module
     (`quotes/models.py`, `views.py`, etc.). A project holds many apps.

3. **Wrote the feature.** I filled in the four files that make a REST resource: a
   `Quote` **model** (the database table), a **serializer** (model ⇄ JSON), a **viewset**
   (the request handlers), and a **router** entry in `urls.py` (the URLs). I also
   registered `Quote` in the Django **admin** so it's editable through Django's built-in
   admin UI.

4. **Configured settings.** I added the three packages to `INSTALLED_APPS`, put the CORS
   middleware near the top of `MIDDLEWARE`, set `CORS_ALLOWED_ORIGINS` to the React dev
   server's address, and turned on DRF pagination.

5. **Created and applied the database schema, then verified.** `makemigrations` turned my
   model into a migration file; `migrate` ran it to build the SQLite tables. I then started
   the server and confirmed with real HTTP calls that I could POST a quote, GET the list
   back, and that the browser CORS preflight succeeds.

Finally I added a small **React + Vite** frontend that calls the API, plus this
documentation and `.gitignore` files.

---

## 2. Project layout

```
django-react-starter/
├── backend/                 ← the Django API (Python)
│   ├── manage.py            CLI entry point for all Django commands
│   ├── requirements.txt     Python dependencies
│   ├── config/              the "project": global config
│   │   ├── settings.py      every setting (apps, middleware, DB, CORS)
│   │   ├── urls.py          the root URL map
│   │   ├── wsgi.py          entry point for production servers (sync)
│   │   ├── asgi.py          entry point for async servers
│   │   └── __init__.py      marks the folder as a Python package
│   └── quotes/              the "app": one feature (quotes)
│       ├── models.py        DB table definition (the ORM)
│       ├── serializers.py   converts model rows ⇄ JSON
│       ├── views.py         request handlers (the viewset)
│       ├── admin.py         registers the model in Django's admin UI
│       ├── apps.py          app configuration metadata
│       ├── tests.py         where tests would go
│       └── migrations/      versioned schema-change files
│           └── 0001_initial.py
└── frontend/                ← the React app (JavaScript)
    ├── index.html           page shell Vite serves
    ├── package.json         JS dependencies + scripts
    ├── vite.config.js       dev-server config (port 5173)
    └── src/
        ├── main.jsx         mounts React into the page
        ├── App.jsx          the UI: list + create form
        ├── api.js           fetch() wrappers around the API
        └── styles.css
```

---

## 3. The big picture: how a request flows through Django

When the browser hits `GET http://127.0.0.1:8000/api/quotes/`, this happens in order:

```
Browser
  │  HTTP request
  ▼
manage.py / wsgi.py            ← the server process running Django
  │
  ▼
MIDDLEWARE (settings.py)       ← request passes through each layer:
  │                              CORS, security, sessions, auth …
  ▼
config/urls.py                 ← matches the URL "/api/quotes/"
  │                              and hands off to the router
  ▼
quotes/views.py  QuoteViewSet  ← the handler. Decides this is a "list" action
  │
  ▼
quotes/models.py  Quote        ← the ORM runs SQL: SELECT * FROM quotes
  │                              and returns Python objects
  ▼
quotes/serializers.py          ← turns those objects into JSON-ready dicts
  │
  ▼
HTTP response (JSON)  ──────────► back through middleware ──► Browser
```

Django's nickname for this shape is **MTV** — *Model, Template, View*. Because we're
building a JSON API instead of server-rendered HTML, the serializer takes the place the
template would normally hold.

---

## 4. The backend, file by file

### `manage.py` — the command-line entry point
A thin script you run everything through: `python manage.py runserver`,
`migrate`, `makemigrations`, `createsuperuser`, etc. It just sets which settings module to
use, then forwards your command to Django. You rarely edit it.

### `config/settings.py` — all configuration
One Python file of module-level variables. The ones that matter here:

- **`INSTALLED_APPS`** — the list of apps Django loads. I appended the two third-party
  packages and our local app:
  ```python
  INSTALLED_APPS = [
      # …Django's built-ins…
      'rest_framework',   # Django REST Framework
      'corsheaders',      # CORS support
      'quotes',           # our app
  ]
  ```
  Django only knows about models, admin pages, etc. for apps in this list.

- **`MIDDLEWARE`** — an ordered pipeline every request/response passes through. CORS must
  run early so it can attach the right headers, so it sits at the top:
  ```python
  MIDDLEWARE = [
      'corsheaders.middleware.CorsMiddleware',  # added, near the top
      'django.middleware.security.SecurityMiddleware',
      # …
  ]
  ```

- **`DATABASES`** — points at a SQLite file (`db.sqlite3`) by default. Zero setup; swap the
  `ENGINE`/`NAME` for PostgreSQL in real projects.

- **`REST_FRAMEWORK`** — DRF's own settings. I enabled pagination so big lists come back in
  pages of 20 rather than all at once.

- **`CORS_ALLOWED_ORIGINS`** — the list of web origins allowed to call this API from a
  browser. It contains the Vite dev server (`http://localhost:5173`). Without this the
  browser would block the React app's `fetch()` calls. (More on why in §7.)

### `config/urls.py` — the URL map
Django matches incoming paths against `urlpatterns` top to bottom. Instead of writing a URL
for every action by hand, DRF's **router** generates them from the viewset:

```python
from rest_framework.routers import DefaultRouter
from quotes.views import QuoteViewSet

router = DefaultRouter()
router.register("quotes", QuoteViewSet)   # creates all the /quotes/ URLs

urlpatterns = [
    path("admin/", admin.site.urls),       # Django's built-in admin
    path("api/", include(router.urls)),    # mounts the router under /api/
]
```

That single `register("quotes", …)` produces the full REST set:

| Method | URL | What runs |
| --- | --- | --- |
| GET | `/api/quotes/` | list |
| POST | `/api/quotes/` | create |
| GET | `/api/quotes/{id}/` | retrieve one |
| PUT / PATCH | `/api/quotes/{id}/` | update |
| DELETE | `/api/quotes/{id}/` | delete |

### `config/wsgi.py` and `asgi.py` — production entry points
When you deploy, a production server (Gunicorn, uWSGI, Uvicorn) imports one of these to get
the Django "application" object. `wsgi` is the traditional synchronous interface; `asgi` is
the async one. You don't touch them during normal development — `runserver` uses them for
you.

### `quotes/models.py` — the database table
A model is a Python class that describes one table. Django's **ORM** (Object-Relational
Mapper) translates between these classes and SQL so you rarely write SQL yourself.

```python
from django.db import models

class Quote(models.Model):
    customer = models.CharField(max_length=200)
    total    = models.DecimalField(max_digits=10, decimal_places=2)
    notes    = models.TextField(blank=True)
    created  = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created"]      # default sort: newest first

    def __str__(self):
        return f"{self.customer} (${self.total})"
```

Reading it line by line:

- **`class Quote(models.Model)`** — inheriting from `models.Model` is what makes this a
  database table. Django auto-adds an `id` primary key, so we don't declare one.
- **Each class attribute is a column.** The *field type* (`CharField`, `DecimalField`,
  `TextField`, `DateTimeField`) decides the SQL column type and how values are validated.
  - `max_length=200` — required for text columns.
  - `decimal_places=2` — store money exactly (avoid floats for currency).
  - `blank=True` — this field may be empty (here, notes are optional).
  - `auto_now_add=True` — Django stamps the current time once, when the row is created.
- **`class Meta`** — a nested config class. `ordering = ["-created"]` means queries return
  newest first by default. The leading `-` means descending — the same convention DRF and
  Django use everywhere.
- **`def __str__`** — Python's "how do I print this object?" method (like JS `toString()`).
  Django shows it in the admin and in shell output. The `f"…{var}…"` syntax is an
  *f-string*: string interpolation, like a JS template literal.

Once you save a model, you generate a **migration** and apply it — see `migrations/` below.
Then you query it through the ORM, e.g. `Quote.objects.all()` (≈ `SELECT * FROM quotes`) or
`Quote.objects.filter(customer="Acme")` (≈ a `WHERE` clause).

### `quotes/migrations/0001_initial.py` — versioned schema changes
Django doesn't change your database silently. The workflow is two steps:

```bash
python manage.py makemigrations   # diff your models → write a migration file
python manage.py migrate          # run pending migrations against the DB
```

`makemigrations` compares your current models to the last known state and writes a Python
file (`0001_initial.py`) describing the change ("create table quotes with these columns").
`migrate` executes those files in order and records which have run. The files are committed
to git, so every developer and every server builds the exact same schema. It's essentially
version control for your database structure.

### `quotes/serializers.py` — JSON in, JSON out
The serializer is DRF's translation layer. It does two jobs: turn model objects into
JSON-serializable data (for responses), and validate + parse incoming JSON into model data
(for `POST`/`PUT`).

```python
from rest_framework import serializers
from .models import Quote

class QuoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Quote
        fields = ["id", "customer", "total", "notes", "created"]
        read_only_fields = ["id", "created"]
```

- **`ModelSerializer`** inspects the model and builds matching fields automatically, so we
  only declare the model and which fields to expose.
- **`fields`** is an allowlist — only these appear in JSON, and only these are accepted from
  clients. (Never blindly expose every column.)
- **`read_only_fields`** — `id` and `created` are set by the database/Django, so clients
  can't write them; they appear in responses but are ignored in requests. This is also where
  custom validation would live if we needed it.

### `quotes/views.py` — the request handler
In plain Django a "view" is a function/class that takes a request and returns a response.
DRF's **`ModelViewSet`** bundles all five CRUD handlers into one class:

```python
from rest_framework import viewsets
from .models import Quote
from .serializers import QuoteSerializer

class QuoteViewSet(viewsets.ModelViewSet):
    queryset = Quote.objects.all()
    serializer_class = QuoteSerializer
```

That's the whole thing. By giving it just two attributes —

- **`queryset`** — which rows this endpoint operates on (`Quote.objects.all()` = the manager
  that builds queries; `.all()` is the base query), and
- **`serializer_class`** — how to convert them to/from JSON —

DRF fills in `list`, `create`, `retrieve`, `update`, `partial_update`, and `destroy` for
you. The router (in `urls.py`) wires each to the correct URL + HTTP method. You'd override a
method only when you need custom behavior (extra filtering, permissions, side effects).

### `quotes/admin.py` — the free admin UI
Django ships a full CRUD admin website. Registering the model turns it on for `Quote`:

```python
@admin.register(Quote)
class QuoteAdmin(admin.ModelAdmin):
    list_display = ["id", "customer", "total", "created"]
    search_fields = ["customer"]
```

- **`@admin.register(Quote)`** — a *decorator*, Python's `@`-syntax for "wrap/annotate this
  thing." Here it registers the class with the admin site. (Decorators are roughly like
  higher-order functions / HOCs in React.)
- **`list_display`** — columns shown in the admin's table view.
- **`search_fields`** — adds a search box that filters on customer name.

Create a login with `python manage.py createsuperuser`, then visit `/admin/` to view/edit
data with no extra code. It's great for inspecting your database while developing.

### `quotes/apps.py` — app metadata
Auto-generated config for the app (its name and default primary-key type). You almost never
edit it; it exists so Django can discover and configure the app.

### `requirements.txt` — Python dependencies
The Python analog of `package.json`'s dependency list. `pip install -r requirements.txt`
installs exactly these. We pin Django to the 5.1.x line and require recent DRF and
cors-headers.

---

## 5. Python features you'll notice in this code

A quick reference for the syntax that differs from JavaScript:

- **Indentation defines blocks.** No `{}` and no semicolons; a colon plus indentation opens
  a block.
- **Classes and `self`.** Methods take `self` (≈ `this`) as an explicit first parameter.
  `__init__` is the constructor; `__str__` is like `toString()`. Methods named with double
  underscores ("dunder" methods) hook into language behavior.
- **Inheritance carries behavior.** `class Quote(models.Model)` and
  `class QuoteViewSet(viewsets.ModelViewSet)` get almost all their power from the parent
  class — that's why our own classes are so short.
- **Decorators (`@admin.register(...)`).** A function/class that wraps another to add
  behavior, applied with `@` on the line above.
- **Nested `class Meta`.** A Django/DRF convention for attaching declarative configuration
  to a model or serializer.
- **f-strings (`f"{x}"`).** String interpolation, like JS template literals.
- **Keyword arguments (`max_length=200`).** Named arguments passed inline; very common in
  Python APIs and used heavily by Django fields.

---

## 6. The frontend, briefly, and how the two halves talk

The React side is intentionally minimal:

- **`src/api.js`** wraps the two calls with `fetch()`. Note this detail:
  ```js
  const data = await res.json();
  return data.results;   // DRF pagination nests rows under "results"
  ```
  Because we enabled pagination, a list response looks like
  `{ count, next, previous, results: [...] }`, so the frontend reads `data.results`.
- **`src/App.jsx`** loads quotes once on mount with `useEffect`, renders them, and posts a
  new quote on form submit (then prepends it to the list so the UI updates instantly).
- **`src/main.jsx`** mounts `<App />` into the page. **`vite.config.js`** pins the dev
  server to port 5173 — the exact origin Django's `CORS_ALLOWED_ORIGINS` permits.

### Why CORS is necessary
The React dev server runs at `http://localhost:5173`; the API runs at
`http://127.0.0.1:8000`. Different port = different *origin*, and browsers block
cross-origin requests by default (the "same-origin policy"). `django-cors-headers` makes
Django send the `Access-Control-Allow-Origin` header that tells the browser "this origin is
allowed," which is why the frontend can talk to the backend in development.

In **production** you typically build the React app to static files and serve them and the
API under one domain (e.g. `/` for the app, `/api/` for Django), so there's no cross-origin
request and CORS isn't needed at all.

---

## 7. Glossary

- **Project vs app** — a project is the whole Django site (config + many apps); an app is one
  cohesive feature. Reusable apps can be shared across projects.
- **ORM** — Object-Relational Mapper: write Python, get SQL. `Model` classes are tables,
  instances are rows, `.objects` builds queries.
- **Migration** — a generated, committed file describing a schema change; `migrate` applies
  it. Version control for your database structure.
- **Serializer** — DRF's model⇄JSON translator and validator.
- **View / ViewSet** — the request handler. A `ModelViewSet` provides all CRUD actions.
- **Router** — generates REST URLs from a viewset.
- **Middleware** — ordered request/response processing layers (security, sessions, CORS…).
- **CORS** — browser rule governing cross-origin requests; we allow the React origin
  explicitly.
- **WSGI/ASGI** — the interfaces production servers use to run Django (sync / async).
```
