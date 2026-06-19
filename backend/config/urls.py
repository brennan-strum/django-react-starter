from django.contrib import admin
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from quotes.views import QuoteViewSet

# The router auto-generates the REST URLs for the viewset.
router = DefaultRouter()
router.register("quotes", QuoteViewSet)

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include(router.urls)),
]
