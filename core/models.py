from django.db import models


class Doacao(models.Model):
    STATUS_CHOICES = [
        ("Recebido", "Recebido"),
        ("Repassado", "Repassado"),
        ("Processado", "Processado"),
    ]

    doacao_item = models.CharField(max_length=100)
    remetente = models.CharField(max_length=120)
    quantidade = models.PositiveIntegerField()
    cpf_cnpj = models.CharField(max_length=20, blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="Recebido")
    data = models.DateField()
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-data", "-id"]

    def __str__(self):
        return f"{self.doacao_item} - {self.quantidade}"
