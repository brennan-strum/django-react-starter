from rest_framework import serializers

from .models import Quote


class QuoteSerializer(serializers.ModelSerializer):
    """Converts Quote instances to/from JSON and validates input."""

    class Meta:
        model = Quote
        fields = ["id", "customer", "total", "notes", "created"]
        read_only_fields = ["id", "created"]
