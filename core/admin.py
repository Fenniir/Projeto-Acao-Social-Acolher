from django.contrib import admin
from .models import Doador, Destinatario, Doacao

admin.site.register(Doador)
admin.site.register(Destinatario)
admin.site.register(Doacao)