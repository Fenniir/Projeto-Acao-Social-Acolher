from django.urls import path
from . import views

urlpatterns = [
    path('', views.listar_doacoes, name='listar_doacoes'),
    path('doador/cadastrar/', views.cadastrar_doador, name='cadastrar_doador'),
    path('doador/buscar/', views.buscar_doador, name='buscar_doador'),
    path('destinatario/cadastrar/', views.cadastrar_destinatario, name='cadastrar_destinatario'),
    path('destinatario/buscar/', views.buscar_destinatario, name='buscar_destinatario'),
    path('doacao/cadastrar/', views.cadastrar_doacao, name='cadastrar_doacao'),
    path('doacao/<int:doacao_id>/status/', views.alterar_status, name='alterar_status'),
]