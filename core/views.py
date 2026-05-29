import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.db.models import Sum
from .models import Doacao


@csrf_exempt
@require_http_methods(["GET", "POST"])
def doacoes(request):
    if request.method == 'GET':
        lista = Doacao.objects.all().order_by('-data_registro')
        dados = []
        for d in lista:
            dados.append({
                'id': d.id,
                'doacao_item': d.doacao_item,
                'remetente': d.remetente,
                'quantidade': d.quantidade,
                'cpf_cnpj': d.cpf_cnpj,
                'status': d.status,
                'data': str(d.data),
            })
        return JsonResponse(dados, safe=False)

    if request.method == 'POST':
        try:
            body = json.loads(request.body)
            doacao = Doacao.objects.create(
                doacao_item=body.get('doacao_item', ''),
                remetente=body.get('remetente', ''),
                quantidade=body.get('quantidade', 1),
                cpf_cnpj=body.get('cpf_cnpj', ''),
                status=body.get('status', 'Recebido'),
                data=body.get('data'),
            )
            return JsonResponse({'id': doacao.id}, status=201)
        except Exception as e:
            return JsonResponse({'erro': str(e)}, status=400)


@csrf_exempt
@require_http_methods(["PATCH", "DELETE"])
def doacao_detalhe(request, id):
    try:
        doacao = Doacao.objects.get(id=id)
    except Doacao.DoesNotExist:
        return JsonResponse({'erro': 'Não encontrado'}, status=404)

    if request.method == 'PATCH':
        try:
            body = json.loads(request.body)
            doacao.doacao_item = body.get('doacao_item', doacao.doacao_item)
            doacao.remetente = body.get('remetente', doacao.remetente)
            doacao.quantidade = body.get('quantidade', doacao.quantidade)
            doacao.cpf_cnpj = body.get('cpf_cnpj', doacao.cpf_cnpj)
            doacao.status = body.get('status', doacao.status)
            doacao.data = body.get('data', doacao.data)
            doacao.save()
            return JsonResponse({'ok': True})
        except Exception as e:
            return JsonResponse({'erro': str(e)}, status=400)

    if request.method == 'DELETE':
        doacao.delete()
        return JsonResponse(None, safe=False, status=204)


@require_http_methods(["GET"])
def estoque(request):
    itens = Doacao.objects.values('doacao_item').distinct()
    resultado = []
    for item in itens:
        nome = item['doacao_item']
        qs = Doacao.objects.filter(doacao_item=nome)
        recebido = qs.filter(status='Recebido').aggregate(total=Sum('quantidade'))['total'] or 0
        repassado = qs.filter(status='Repassado').aggregate(total=Sum('quantidade'))['total'] or 0
        processado = qs.filter(status='Processado').aggregate(total=Sum('quantidade'))['total'] or 0
        resultado.append({
            'doacao_item': nome,
            'recebido': recebido,
            'repassado': repassado,
            'processado': processado,
            'saldo': recebido - repassado - processado,
        })
    return JsonResponse(resultado, safe=False)