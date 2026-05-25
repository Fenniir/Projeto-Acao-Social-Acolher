import json
from django.db.models import Sum
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from .models import Doacao


def resposta_cors(resposta):
    resposta["Access-Control-Allow-Origin"] = "*"
    resposta["Access-Control-Allow-Methods"] = "GET, POST, PUT, PATCH, DELETE, OPTIONS"
    resposta["Access-Control-Allow-Headers"] = "Content-Type"
    return resposta


def doacao_para_json(doacao):
    return {
        "id": doacao.id,
        "doacao_item": doacao.doacao_item,
        "remetente": doacao.remetente,
        "quantidade": doacao.quantidade,
        "cpf_cnpj": doacao.cpf_cnpj or "",
        "status": doacao.status,
        "data": doacao.data.isoformat(),
        "criado_em": doacao.criado_em.isoformat(),
    }


@csrf_exempt
@require_http_methods(["GET", "POST", "OPTIONS"])
def doacoes(request):
    if request.method == "OPTIONS":
        return resposta_cors(JsonResponse({}))

    if request.method == "GET":
        dados = [doacao_para_json(doacao) for doacao in Doacao.objects.all()]
        return resposta_cors(JsonResponse(dados, safe=False))

    try:
        dados = json.loads(request.body.decode("utf-8"))
        doacao = Doacao.objects.create(
            doacao_item=dados.get("doacao_item", "").strip(),
            remetente=dados.get("remetente", "").strip(),
            quantidade=int(dados.get("quantidade", 0)),
            cpf_cnpj=dados.get("cpf_cnpj", "").strip(),
            status=dados.get("status", "Recebido"),
            data=dados.get("data"),
        )
        return resposta_cors(JsonResponse(doacao_para_json(doacao), status=201))
    except Exception as erro:
        return resposta_cors(JsonResponse({"erro": str(erro)}, status=400))


@csrf_exempt
@require_http_methods(["GET", "PATCH", "DELETE", "OPTIONS"])
def doacao_detalhe(request, doacao_id):
    if request.method == "OPTIONS":
        return resposta_cors(JsonResponse({}))

    try:
        doacao = Doacao.objects.get(id=doacao_id)
    except Doacao.DoesNotExist:
        return resposta_cors(JsonResponse({"erro": "Doação não encontrada."}, status=404))

    if request.method == "GET":
        return resposta_cors(JsonResponse(doacao_para_json(doacao)))

    if request.method == "DELETE":
        doacao.delete()
        return resposta_cors(JsonResponse({"mensagem": "Doação apagada."}))

    try:
        dados = json.loads(request.body.decode("utf-8"))
        for campo in ["doacao_item", "remetente", "quantidade", "cpf_cnpj", "status", "data"]:
            if campo in dados:
                setattr(doacao, campo, dados[campo])
        doacao.save()
        return resposta_cors(JsonResponse(doacao_para_json(doacao)))
    except Exception as erro:
        return resposta_cors(JsonResponse({"erro": str(erro)}, status=400))


@require_http_methods(["GET", "OPTIONS"])
def estoque(request):
    if request.method == "OPTIONS":
        return resposta_cors(JsonResponse({}))

    itens = Doacao.objects.values("doacao_item", "status").annotate(total=Sum("quantidade"))
    agrupado = {}

    for item in itens:
        nome = item["doacao_item"]
        status = item["status"].lower()
        agrupado.setdefault(nome, {"doacao_item": nome, "recebido": 0, "repassado": 0, "processado": 0, "saldo": 0})
        agrupado[nome][status] = item["total"] or 0

    for item in agrupado.values():
        item["saldo"] = item["recebido"] + item["processado"] - item["repassado"]

    return resposta_cors(JsonResponse(list(agrupado.values()), safe=False))
