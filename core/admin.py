from django.contrib import admin
from .models import Doacao


@admin.register(Doacao)
class DoacaoAdmin(admin.ModelAdmin):
    list_display = ("doacao_item", "remetente", "quantidade", "status", "data")
    search_fields = ("doacao_item", "remetente", "cpf_cnpj")
    list_filter = ("status", "data")
