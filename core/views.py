import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from .models import Doacao


def doacao_para_json(d):
    saldo = d.quantidade - d.quantidade_repassada

    return {
        'id': d.id,
        'doacao_item': d.doacao_item,
        'remetente': d.remetente,
        'quantidade': d.quantidade,
        'quantidade_repassada': d.quantidade_repassada,
        'saldo': saldo,
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
        dados = [doacao_para_json(d) for d in lista]
        return JsonResponse(dados, safe=False)

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
                quantidade_repassada=0,
                data=body.get('data'),
            )

            return JsonResponse(doacao_para_json(doacao), status=201)

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

            nova_quantidade = int(body.get('quantidade', doacao.quantidade))

            if nova_quantidade < doacao.quantidade_repassada:
                return JsonResponse({
                    'erro': 'A quantidade não pode ser menor que a quantidade já repassada.'
                }, status=400)

            doacao.doacao_item = body.get('doacao_item', doacao.doacao_item)
            doacao.remetente = body.get('remetente', doacao.remetente)
            doacao.quantidade = nova_quantidade
            doacao.cpf_cnpj = body.get('cpf_cnpj', doacao.cpf_cnpj)
            doacao.tipo = body.get('tipo', doacao.tipo)
            doacao.descricao = body.get('descricao', doacao.descricao)
            doacao.data = body.get('data', doacao.data)

            # O status não vem mais do formulário.
            # Ele é calculado automaticamente pelo sistema.
            doacao.atualizar_status()
            doacao.save()

            return JsonResponse(doacao_para_json(doacao))

        except Exception as e:
            return JsonResponse({'erro': str(e)}, status=400)

    if request.method == 'DELETE':
        doacao.delete()
        return JsonResponse(None, safe=False, status=204)


@csrf_exempt
@require_http_methods(["POST"])
def repassar_doacao(request, id):
    try:
        doacao = Doacao.objects.get(id=id)
    except Doacao.DoesNotExist:
        return JsonResponse({'erro': 'Não encontrado'}, status=404)

    try:
        body = json.loads(request.body)
        quantidade = int(body.get('quantidade', 0))
        saldo = doacao.quantidade - doacao.quantidade_repassada

        if quantidade <= 0:
            return JsonResponse({'erro': 'Informe uma quantidade maior que zero.'}, status=400)

        if quantidade > saldo:
            return JsonResponse({'erro': 'A quantidade repassada é maior que o saldo disponível.'}, status=400)

        doacao.quantidade_repassada += quantidade
        doacao.atualizar_status()
        doacao.save()

        return JsonResponse(doacao_para_json(doacao))

    except Exception as e:
        return JsonResponse({'erro': str(e)}, status=400)


@require_http_methods(["GET"])
def estoque(request):
    # O estoque mostra apenas o que ainda tem saldo.
    # Se o status for Repassado, ele fica só no histórico de doações.
    lista = Doacao.objects.exclude(status='Repassado').order_by('-data_registro')
    dados = [doacao_para_json(d) for d in lista]
    return JsonResponse(dados, safe=False)
