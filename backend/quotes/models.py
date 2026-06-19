from django.db import models


class Quote(models.Model):
    """A single sales quote for a customer."""

    customer = models.CharField(max_length=200)
    total = models.DecimalField(max_digits=10, decimal_places=2)
    notes = models.TextField(blank=True)
    created = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created"]  # newest first

    def __str__(self):
        return f"{self.customer} (${self.total})"
