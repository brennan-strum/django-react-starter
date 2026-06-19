# Django + React Starter

A minimal full-stack sample: a **Django REST Framework** JSON API (`backend/`) and a
**React + Vite** single-page app (`frontend/`) that consumes it. The demo resource is a
list of "quotes" with full CRUD.

```
django-react-starter/
├── backend/          Django project (API)
│   ├── config/       project settings + root URLs
│   │   ├── settings.py
│   │   └── urls.py
│   ├── quotes/       the "quotes" feature app
│   │   ├── models.py        # Quote DB table
│   │   ├── serializers.py   # model <-> JSON
│   │   ├── views.py         # QuoteViewSet (CRUD)
│   │   └── admin.py
│   ├── manage.py
│   └── requirements.txt
└── frontend/         React + Vite SPA
    ├── src/
    │   ├── api.js    # fetch wrappers around the API
    │   ├── App.jsx   # list + create form
    │   └── main.jsx
    └── package.json
```

## Prerequisites

- Python 3.10+
- Node 18+

## 1. Run the backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate           # create the SQLite database
python manage.py runserver         # http://127.0.0.1:8000
```

The API is now live at **http://127.0.0.1:8000/api/quotes/**. DRF also serves a
browsable HTML interface there — open it in a browser to click around.

Optional — create an admin login to inspect data at `/admin/`:

```bash
python manage.py createsuperuser
```

## 2. Run the frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev                        # http://localhost:5173
```

Open http://localhost:5173. Add a quote in the form and it persists to the Django
database via the API.

## How the pieces connect

- **Model → migrate → serializer → viewset → router** is the core DRF loop. To add a
  new resource, repeat those five steps in (or alongside) the `quotes` app.
- The router in `config/urls.py` exposes:

  | Method | URL | Action |
  | --- | --- | --- |
  | GET | `/api/quotes/` | list |
  | POST | `/api/quotes/` | create |
  | GET | `/api/quotes/{id}/` | retrieve |
  | PUT/PATCH | `/api/quotes/{id}/` | update |
  | DELETE | `/api/quotes/{id}/` | delete |

- **CORS:** React (`localhost:5173`) and Django (`127.0.0.1:8000`) are different origins,
  so `django-cors-headers` is configured in `settings.py` (`CORS_ALLOWED_ORIGINS`) to
  allow the browser to call the API. In production you'd typically serve the built React
  files and the API under one domain instead.
- **Pagination:** list responses are wrapped as `{ count, next, previous, results }`.
  The frontend reads `data.results` (see `frontend/src/api.js`).

## Next steps to explore

- Add authentication with `djangorestframework-simplejwt` (token-based, ideal for SPAs).
- Add filtering/search with `django-filter`.
- Swap SQLite for PostgreSQL in `settings.py` `DATABASES`.
- Add `PUT`/`DELETE` buttons in the React UI (the API already supports them).
