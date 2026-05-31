import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from .models import Doacao


def doacao_to_dict(d):
    return {
        'id': d.id,
        'doacao_item': d.doacao_item,
        'remetente': d.remetente,
        'quantidade': d.quantidade,
        'quantidade_repassada': d.quantidade_repassada,
        'saldo': d.saldo,
        'cpf_cnpj': d.cpf_cnpj,
        'tipo': d.tipo,
        'descricao': d.descricao,
        'status': d.status,
        'data': str(d.data),
    }


@csrf_exempt
@require_http_methods(["GET", "POST"])
def doacoes(request):
    if request.method == 'GET':
        lista = Doacao.objects.all().order_by('-data_registro')
        return JsonResponse([doacao_to_dict(d) for d in lista], safe=False)

    if request.method == 'POST':
        try:
            body = json.loads(request.body)
            doacao = Doacao.objects.create(
                doacao_item=body.get('doacao_item', ''),
                remetente=body.get('remetente', ''),
                quantidade=body.get('quantidade', 1),
                cpf_cnpj=body.get('cpf_cnpj', ''),
                tipo=body.get('tipo', 'Outros'),
                descricao=body.get('descricao', ''),
                status='Recebido',
                data=body.get('data'),
            )
            return JsonResponse(doacao_to_dict(doacao), status=201)
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
            doacao.tipo = body.get('tipo', doacao.tipo)
            doacao.descricao = body.get('descricao', doacao.descricao)
            doacao.data = body.get('data', doacao.data)
            doacao.save()
            return JsonResponse(doacao_to_dict(doacao))
        except Exception as e:
            return JsonResponse({'erro': str(e)}, status=400)

    if request.method == 'DELETE':
        doacao.delete()
        return JsonResponse(None, safe=False, status=204)


@csrf_exempt
@require_http_methods(["POST"])
def doacao_repassar(request, id):
    try:
        doacao = Doacao.objects.get(id=id)
    except Doacao.DoesNotExist:
        return JsonResponse({'erro': 'Não encontrado'}, status=404)

    try:
        body = json.loads(request.body)
        quantidade = int(body.get('quantidade', 0))

        if quantidade <= 0:
            return JsonResponse({'erro': 'Quantidade inválida.'}, status=400)

        if quantidade > doacao.saldo:
            return JsonResponse({'erro': f'Quantidade maior que o saldo disponível ({doacao.saldo}).'}, status=400)

        doacao.quantidade_repassada += quantidade

        if doacao.quantidade_repassada >= doacao.quantidade:
            doacao.status = 'Repassado'
            doacao.quantidade_repassada = doacao.quantidade
        else:
            doacao.status = 'Processando'

        doacao.save()
        return JsonResponse(doacao_to_dict(doacao))
    except Exception as e:
        return JsonResponse({'erro': str(e)}, status=400)


@require_http_methods(["GET"])
def estoque(request):
    lista = Doacao.objects.all().order_by('-data_registro')
    return JsonResponse([doacao_to_dict(d) for d in lista], safe=False)