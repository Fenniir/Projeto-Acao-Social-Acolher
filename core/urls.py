from django.urls import path
from django.views.generic import TemplateView
from . import views

urlpatterns = [
    path('', views.pagina_index, name='index'),
    path('login/', TemplateView.as_view(template_name='login.html'), name='login'),
    path('estoque/', views.pagina_estoque, name='estoque_page'),
    path('doacao/', views.pagina_doacao, name='doacao_page'),
    path('registrar/', views.pagina_registrar, name='registrar_page'),
    path('api/login/', views.login_view, name='api_login'),
    path('api/doacoes/', views.doacoes, name='doacoes'),
    path('api/doacoes/<int:id>/', views.doacao_detalhe, name='doacao_detalhe'),
    path('api/doacoes/<int:id>/repassar/', views.doacao_repassar, name='doacao_repassar'),
    path('api/estoque/', views.estoque, name='estoque'),
]