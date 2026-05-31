from django.db import models

class Doacao(models.Model):
    STATUS_CHOICES = [
        ('Recebido', 'Recebido'),
        ('Processando', 'Processando'),
        ('Repassado', 'Repassado'),
    ]
    TIPO_CHOICES = [
        ('Alimento', 'Alimento'),
        ('Roupa', 'Roupa'),
        ('Outros', 'Outros'),
    ]

    doacao_item = models.CharField(max_length=200)
    remetente = models.CharField(max_length=100)
    quantidade = models.PositiveIntegerField(default=1)
    quantidade_repassada = models.PositiveIntegerField(default=0)
    cpf_cnpj = models.CharField(max_length=18, blank=True, default='')
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES, default='Outros')
    descricao = models.TextField(blank=True, default='')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Recebido')
    data = models.DateField()
    data_registro = models.DateTimeField(auto_now_add=True)

    @property
    def saldo(self):
        return self.quantidade - self.quantidade_repassada

    def __str__(self):
        return f"{self.doacao_item} - {self.remetente}"