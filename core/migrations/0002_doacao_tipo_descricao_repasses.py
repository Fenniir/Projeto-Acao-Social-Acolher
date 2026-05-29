# Generated manually for Projeto Acolher.

from django.db import migrations, models


def trocar_processado_para_processando(apps, schema_editor):
    Doacao = apps.get_model('core', 'Doacao')
    Doacao.objects.filter(status='Processado').update(status='Processando')


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='doacao',
            name='quantidade_repassada',
            field=models.PositiveIntegerField(default=0),
        ),
        migrations.AddField(
            model_name='doacao',
            name='tipo',
            field=models.CharField(choices=[('Alimento', 'Alimento'), ('Roupa', 'Roupa'), ('Outros', 'Outros')], default='Outros', max_length=20),
        ),
        migrations.AddField(
            model_name='doacao',
            name='descricao',
            field=models.TextField(blank=True),
        ),
        migrations.AlterField(
            model_name='doacao',
            name='status',
            field=models.CharField(choices=[('Recebido', 'Recebido'), ('Processando', 'Processando'), ('Repassado', 'Repassado')], default='Recebido', max_length=20),
        ),
        migrations.RunPython(trocar_processado_para_processando, migrations.RunPython.noop),
    ]
