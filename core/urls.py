from django.urls import path
from . import views

urlpatterns = [
    path("doacoes/", views.doacoes, name="doacoes"),
    path("doacoes/<int:doacao_id>/", views.doacao_detalhe, name="doacao_detalhe"),
    path("estoque/", views.estoque, name="estoque"),
]
