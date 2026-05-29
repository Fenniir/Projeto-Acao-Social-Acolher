from django.urls import path
from django.views.generic import TemplateView
from . import views

urlpatterns = [
    path('', TemplateView.as_view(template_name='index.html'), name='index'),
    path('login/', TemplateView.as_view(template_name='login.html'), name='login'),
    path('estoque/', TemplateView.as_view(template_name='acaoSocialEstoque.html'), name='estoque_page'),
    path('doacao/', TemplateView.as_view(template_name='acaoSocialDoacao.html'), name='doacao_page'),
    path('registrar/', TemplateView.as_view(template_name='acaoSocialRegistrarDoacao.html'), name='registrar_page'),
    path('api/doacoes/', views.doacoes, name='doacoes'),
    path('api/doacoes/<int:id>/', views.doacao_detalhe, name='doacao_detalhe'),
    path('api/doacoes/<int:id>/repassar/', views.repassar_doacao, name='repassar_doacao'),
    path('api/estoque/', views.estoque, name='estoque'),
]