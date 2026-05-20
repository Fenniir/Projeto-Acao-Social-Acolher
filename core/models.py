from django.db import models

class Doador(models.Model):
    nome = models.CharField(max_length=100)
    cpf_cnpj = models.CharField(max_length=18, unique=True)

    def __str__(self):
        return self.nome

class Destinatario(models.Model):
    nome = models.CharField(max_length=100)
    cpf_cnpj = models.CharField(max_length=18, unique=True)

    def __str__(self):
        return self.nome

class Doacao(models.Model):
    STATUS = [
        ('recebido', 'Recebido'),
        ('processando', 'Processando'),
        ('repassado', 'Repassado'),
    ]
    TIPO = [
        ('alimento', 'Alimento'),
        ('vestuario', 'Vestuário'),
        ('outro', 'Outro'),
    ]

    doador = models.ForeignKey(Doador, on_delete=models.CASCADE)
    destinatario = models.ForeignKey(Destinatario, null=True, blank=True, on_delete=models.SET_NULL)
    tipo = models.CharField(max_length=20, choices=TIPO)
    status = models.CharField(max_length=20, choices=STATUS, default='recebido')
    descricao = models.TextField()
    quantidade = models.PositiveIntegerField(default=1)
    data_validade = models.DateField(null=True, blank=True)
    data_registro = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.tipo} - {self.doador} ({self.status})"