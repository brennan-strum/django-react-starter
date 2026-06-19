from rest_framework import viewsets

from .models import Quote
from .serializers import QuoteSerializer


class QuoteViewSet(viewsets.ModelViewSet):
    """Full CRUD for quotes.

    A ModelViewSet wires up list/create/retrieve/update/destroy actions,
    which the router (see config/urls.py) maps to standard REST routes:

        GET    /api/quotes/        list
        POST   /api/quotes/        create
        GET    /api/quotes/{id}/   retrieve
        PUT    /api/quotes/{id}/   update
        PATCH  /api/quotes/{id}/   partial update
        DELETE /api/quotes/{id}/   destroy
    """

    queryset = Quote.objects.all()
    serializer_class = QuoteSerializer
