from django.shortcuts import render, get_object_or_404, redirect
from .models import Doador, Destinatario, Doacao

# ── Doador ──────────────────────────────────────────────
def cadastrar_doador(request):
    if request.method == 'POST':
        nome = request.POST.get('nome')
        cpf_cnpj = request.POST.get('cpf_cnpj')
        Doador.objects.create(nome=nome, cpf_cnpj=cpf_cnpj)
        return redirect('listar_doacoes')
    return render(request, 'core/cadastrar_doador.html')

def buscar_doador(request):
    resultado = None
    if request.method == 'POST':
        cpf_cnpj = request.POST.get('cpf_cnpj')
        resultado = Doador.objects.filter(cpf_cnpj=cpf_cnpj).first()
    return render(request, 'core/buscar_doador.html', {'resultado': resultado})

# ── Destinatário ─────────────────────────────────────────
def cadastrar_destinatario(request):
    if request.method == 'POST':
        nome = request.POST.get('nome')
        cpf_cnpj = request.POST.get('cpf_cnpj')
        Destinatario.objects.create(nome=nome, cpf_cnpj=cpf_cnpj)
        return redirect('listar_doacoes')
    return render(request, 'core/cadastrar_destinatario.html')

def buscar_destinatario(request):
    resultado = None
    if request.method == 'POST':
        cpf_cnpj = request.POST.get('cpf_cnpj')
        resultado = Destinatario.objects.filter(cpf_cnpj=cpf_cnpj).first()
    return render(request, 'core/buscar_destinatario.html', {'resultado': resultado})

# ── Doação ───────────────────────────────────────────────
def cadastrar_doacao(request):
    doadores = Doador.objects.all()
    destinatarios = Destinatario.objects.all()
    if request.method == 'POST':
        doador_id = request.POST.get('doador')
        destinatario_id = request.POST.get('destinatario')
        tipo = request.POST.get('tipo')
        status = request.POST.get('status')
        descricao = request.POST.get('descricao')
        quantidade = request.POST.get('quantidade')
        data_validade = request.POST.get('data_validade') or None
        Doacao.objects.create(
            doador_id=doador_id,
            destinatario_id=destinatario_id or None,
            tipo=tipo,
            status=status,
            descricao=descricao,
            quantidade=quantidade,
            data_validade=data_validade,
        )
        return redirect('listar_doacoes')
    return render(request, 'core/cadastrar_doacao.html', {
        'doadores': doadores,
        'destinatarios': destinatarios,
    })

def listar_doacoes(request):
    doacoes = Doacao.objects.all().order_by('-data_registro')
    return render(request, 'core/listar_doacoes.html', {'doacoes': doacoes})

def alterar_status(request, doacao_id):
    doacao = get_object_or_404(Doacao, id=doacao_id)
    if request.method == 'POST':
        doacao.status = request.POST.get('status')
        doacao.save()
        return redirect('listar_doacoes')
    return render(request, 'core/alterar_status.html', {'doacao': doacao})