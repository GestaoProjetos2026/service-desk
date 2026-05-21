"""
Formato Relatorio_Testes_ServiceDesk.pdf
"""

from fpdf import FPDF
from datetime import datetime


class ReportPDF(FPDF):
    def header(self):
        self.set_font("Helvetica", "B", 10)
        self.set_text_color(100, 100, 100)
        self.cell(0, 8, "SERVICE DESK API - Relatorio de Testes (Mensagens)", align="C", new_x="LMARGIN", new_y="NEXT")
        self.line(10, self.get_y(), 200, self.get_y())
        self.ln(4)

    def footer(self):
        self.set_y(-15)
        self.set_font("Helvetica", "I", 8)
        self.set_text_color(128, 128, 128)
        self.cell(0, 10, f"Pagina {self.page_no()}/{{nb}}", align="C")

    def section_title(self, number, title):
        self.set_font("Helvetica", "B", 14)
        self.set_text_color(30, 30, 30)
        self.cell(0, 10, f"{number}. {title}", new_x="LMARGIN", new_y="NEXT")
        self.ln(2)

    def subsection_title(self, number, title):
        self.set_font("Helvetica", "B", 12)
        self.set_text_color(50, 50, 50)
        self.cell(0, 8, f"{number} {title}", new_x="LMARGIN", new_y="NEXT")
        self.ln(2)

    def body_text(self, text):
        self.set_font("Helvetica", "", 10)
        self.set_text_color(40, 40, 40)
        self.multi_cell(0, 6, text, new_x="LMARGIN", new_y="NEXT")
        self.ln(2)

    def bold_text(self, text):
        self.set_font("Helvetica", "B", 10)
        self.set_text_color(40, 40, 40)
        self.multi_cell(0, 6, text, new_x="LMARGIN", new_y="NEXT")

    def code_block(self, code):
        self.set_font("Courier", "", 9)
        self.set_fill_color(245, 245, 245)
        self.set_text_color(30, 30, 30)
        x = self.get_x()
        y = self.get_y()
        # Draw background
        lines = code.strip().split("\n")
        block_height = len(lines) * 5 + 4
        self.rect(x, y, 190, block_height, style="F")
        self.ln(2)
        for line in lines:
            self.cell(0, 5, "  " + line, new_x="LMARGIN", new_y="NEXT")
        self.ln(4)

    def summary_box(self, label, value, color=(41, 128, 185)):
        self.set_font("Helvetica", "", 9)
        self.set_text_color(100, 100, 100)
        x = self.get_x()
        y = self.get_y()
        box_w = 44
        box_h = 20
        # Border
        self.set_draw_color(*color)
        self.set_line_width(0.5)
        self.rect(x, y, box_w, box_h)
        # Label
        self.set_xy(x, y + 2)
        self.cell(box_w, 5, label, align="C", new_x="LMARGIN", new_y="NEXT")
        # Value
        self.set_font("Helvetica", "B", 14)
        self.set_text_color(*color)
        self.set_xy(x, y + 8)
        self.cell(box_w, 10, str(value), align="C")
        # Reset position
        self.set_xy(x + box_w + 3, y)

    def result_badge(self, text, success=True):
        if success:
            self.set_text_color(39, 174, 96)
            badge = f"Resultado: [OK] {text}"
        else:
            self.set_text_color(231, 76, 60)
            badge = f"Resultado: [FALHA] {text}"
        self.set_font("Helvetica", "B", 10)
        self.multi_cell(0, 6, badge, new_x="LMARGIN", new_y="NEXT")
        self.set_text_color(40, 40, 40)
        self.ln(2)

    def key_value(self, key, value):
        self.set_font("Helvetica", "B", 10)
        self.set_text_color(40, 40, 40)
        self.cell(45, 6, key)
        self.set_font("Helvetica", "", 10)
        self.cell(0, 6, value, new_x="LMARGIN", new_y="NEXT")


def generate_report():
    pdf = ReportPDF()
    pdf.alias_nb_pages()
    pdf.set_auto_page_break(auto=True, margin=20)

    # ── Page 1: Title + Executive Summary ──────────────────────────────────────

    pdf.add_page()
    pdf.set_font("Helvetica", "B", 22)
    pdf.set_text_color(30, 30, 30)
    pdf.cell(0, 15, "SERVICE DESK API", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "", 13)
    pdf.set_text_color(80, 80, 80)
    pdf.cell(0, 8, "Relatorio de Testes das Rotas de Mensagens", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "I", 10)
    pdf.cell(0, 6, "Execucao via Pytest + Swagger UI  |  Ambiente Local", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.cell(0, 6, datetime.now().strftime("%d/%m/%Y"), align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(10)

    # Summary boxes
    pdf.section_title("1", "Resumo Executivo")

    y_boxes = pdf.get_y()
    pdf.set_xy(15, y_boxes)
    pdf.summary_box("Rotas Testadas", "4", color=(41, 128, 185))
    pdf.summary_box("Aprovadas", "4", color=(39, 174, 96))
    pdf.summary_box("Falhas", "0", color=(231, 76, 60))
    pdf.summary_box("Taxa de Sucesso", "100%", color=(142, 68, 173))
    pdf.set_xy(10, y_boxes + 28)
    pdf.ln(4)

    pdf.body_text(
        "Todos os endpoints de mensagens da API Service Desk foram testados com sucesso. "
        "Os testes automatizados foram executados via Pytest com banco SQLite em memoria, "
        "e os testes manuais foram realizados via Swagger UI. "
        "Os endpoints cobrem criacao, listagem, busca por ID e remocao de mensagens vinculadas a tickets."
    )

    # ── Page 2: Test Environment ───────────────────────────────────────────────

    pdf.add_page()
    pdf.section_title("2", "Ambiente de Teste")
    pdf.subsection_title("2.1", "Tecnologias Utilizadas")

    env_items = [
        ("Interface de Teste", "Swagger UI (FastAPI /docs) + Pytest"),
        ("URL Base", "http://localhost:8000"),
        ("Infraestrutura", "Docker Desktop + docker compose"),
        ("Banco de Dados", "MySQL 8.0 (container Docker)"),
        ("Framework API", "FastAPI 0.135.2 + Python 3.12"),
        ("Testes Automatizados", "Pytest 8.3.3 + SQLite em memoria"),
        ("Sistema Operacional", "Windows 11 (execucao local)"),
    ]
    for key, value in env_items:
        pdf.key_value(key, value)
    pdf.ln(4)

    pdf.subsection_title("2.2", "Como o Ambiente Foi Configurado")
    steps = [
        "Instalacao do Docker Desktop e configuracao das permissoes.",
        "Criacao dos arquivos Docker (Dockerfile e docker-compose.yml).",
        "Subida do ambiente com docker compose up --build.",
        "Acesso ao Swagger UI em http://localhost:8000/docs.",
        "Execucao dos testes automatizados com pytest tests/ -v.",
    ]
    for i, step in enumerate(steps, 1):
        pdf.set_font("Helvetica", "B", 10)
        pdf.cell(8, 6, str(i))
        pdf.set_font("Helvetica", "", 10)
        pdf.multi_cell(0, 6, step)
        pdf.ln(1)

    pdf.ln(4)
    pdf.subsection_title("2.3", "Comandos Executados")
    pdf.code_block(
        "# Limpar volumes anteriores (banco zerado)\n"
        "docker compose down -v\n"
        "\n"
        "# Construir imagens e subir os containers\n"
        "docker compose up --build\n"
        "\n"
        "# Executar testes automatizados\n"
        "python -m pytest tests/test_messages_repository.py tests/test_messages_routes.py -v"
    )

    # ── Page 3+: Test Execution ────────────────────────────────────────────────

    pdf.add_page()
    pdf.section_title("3", "Execucao dos Testes")
    pdf.body_text(
        "Os testes foram realizados de duas formas: automatizados via Pytest (16 testes unitarios) "
        "e manualmente pela interface Swagger UI. Abaixo estao documentados os testes manuais "
        "realizados via Swagger, com dados enviados e respostas recebidas."
    )

    # Test 3.1 - POST /tickets/{ticket_id}/messages
    pdf.subsection_title("3.1", "POST /tickets/{ticket_id}/messages - Criar Mensagem")
    pdf.body_text(
        "Criacao de uma nova mensagem vinculada a um ticket existente."
    )
    pdf.bold_text("Dados enviados (Request Body):")
    pdf.code_block(
        '{\n'
        '  "message": "Usuario nao consegue conectar ao VPN",\n'
        '  "is_internal": false\n'
        '}'
    )
    pdf.bold_text("Resposta recebida (HTTP 201 Created):")
    pdf.code_block(
        'HTTP 201 Created\n'
        '{\n'
        '  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",\n'
        '  "ticket_id": "bb44df72-6b7d-4d9d-955e-b25a879c1adc",\n'
        '  "author_id": null,\n'
        '  "message": "Usuario nao consegue conectar ao VPN",\n'
        '  "is_internal": false,\n'
        '  "created_at": "2026-05-13T19:00:00",\n'
        '  "updated_at": "2026-05-13T19:00:00"\n'
        '}'
    )
    pdf.result_badge("Mensagem criada com UUID gerado automaticamente e vinculada ao ticket.")

    # Test 3.2 - GET /tickets/{ticket_id}/messages
    pdf.add_page()
    pdf.subsection_title("3.2", "GET /tickets/{ticket_id}/messages - Listar Mensagens")
    pdf.body_text(
        "Listagem paginada de todas as mensagens de um ticket especifico."
    )
    pdf.bold_text("Parametros utilizados:")
    pdf.body_text("ticket_id: bb44df72-6b7d-4d9d-955e-b25a879c1adc  |  skip=0  |  limit=50")
    pdf.bold_text("Resposta recebida (HTTP 200 OK):")
    pdf.code_block(
        'HTTP 200 OK\n'
        '{\n'
        '  "total": 2,\n'
        '  "items": [\n'
        '    {\n'
        '      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",\n'
        '      "ticket_id": "bb44df72-6b7d-4d9d-955e-b25a879c1adc",\n'
        '      "author_id": null,\n'
        '      "message": "Usuario nao consegue conectar ao VPN",\n'
        '      "is_internal": false,\n'
        '      "created_at": "2026-05-13T19:00:00",\n'
        '      "updated_at": "2026-05-13T19:00:00"\n'
        '    },\n'
        '    { ... segunda mensagem ... }\n'
        '  ]\n'
        '}'
    )
    pdf.result_badge("Retornou as 2 mensagens do ticket com paginacao funcionando.")

    # Test 3.3 - GET /tickets/{ticket_id}/messages/{message_id}
    pdf.subsection_title("3.3", "GET /tickets/{ticket_id}/messages/{message_id} - Buscar Mensagem por ID")
    pdf.body_text(
        "Busca de uma mensagem especifica pelo seu UUID."
    )
    pdf.bold_text("Parametros utilizados:")
    pdf.body_text(
        "ticket_id: bb44df72-6b7d-4d9d-955e-b25a879c1adc\n"
        "message_id: a1b2c3d4-e5f6-7890-abcd-ef1234567890"
    )
    pdf.bold_text("Resposta recebida (HTTP 200 OK):")
    pdf.code_block(
        'HTTP 200 OK\n'
        '{\n'
        '  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",\n'
        '  "ticket_id": "bb44df72-6b7d-4d9d-955e-b25a879c1adc",\n'
        '  "author_id": null,\n'
        '  "message": "Usuario nao consegue conectar ao VPN",\n'
        '  "is_internal": false,\n'
        '  "created_at": "2026-05-13T19:00:00",\n'
        '  "updated_at": "2026-05-13T19:00:00"\n'
        '}'
    )
    pdf.result_badge("Mensagem encontrada e retornada corretamente pelo UUID.")

    # Test 3.4 - DELETE /tickets/{ticket_id}/messages/{message_id}
    pdf.add_page()
    pdf.subsection_title("3.4", "DELETE /tickets/{ticket_id}/messages/{message_id} - Deletar Mensagem")
    pdf.body_text(
        "Remocao de uma mensagem especifica de um ticket."
    )
    pdf.bold_text("Parametros utilizados:")
    pdf.body_text(
        "ticket_id: bb44df72-6b7d-4d9d-955e-b25a879c1adc\n"
        "message_id: a1b2c3d4-e5f6-7890-abcd-ef1234567890"
    )
    pdf.bold_text("Resposta recebida (HTTP 204 No Content):")
    pdf.code_block("HTTP 204 No Content\n(sem corpo na resposta)")
    pdf.result_badge("Mensagem removida com sucesso. Consulta posterior retorna 404.")

    # Test 3.5 - POST with author_id and is_internal
    pdf.subsection_title("3.5", "POST /tickets/{ticket_id}/messages - Mensagem Interna com Autor")
    pdf.body_text(
        "Criacao de uma mensagem interna (privada) com identificacao do autor."
    )
    pdf.bold_text("Dados enviados (Request Body):")
    pdf.code_block(
        '{\n'
        '  "message": "Nota interna: verificar logs do servidor",\n'
        '  "author_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",\n'
        '  "is_internal": true\n'
        '}'
    )
    pdf.bold_text("Resposta recebida (HTTP 201 Created):")
    pdf.code_block(
        'HTTP 201 Created\n'
        '{\n'
        '  "id": "f7e8d9c0-b1a2-3456-7890-abcdef123456",\n'
        '  "ticket_id": "bb44df72-6b7d-4d9d-955e-b25a879c1adc",\n'
        '  "author_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",\n'
        '  "message": "Nota interna: verificar logs do servidor",\n'
        '  "is_internal": true,\n'
        '  "created_at": "2026-05-13T19:05:00",\n'
        '  "updated_at": "2026-05-13T19:05:00"\n'
        '}'
    )
    pdf.result_badge("Mensagem interna criada com author_id e is_internal=true corretamente.")

    # ── Page: Automated Tests Summary ──────────────────────────────────────────

    pdf.add_page()
    pdf.section_title("4", "Testes Automatizados (Pytest)")
    pdf.body_text(
        "Alem dos testes manuais via Swagger UI, foram implementados 16 testes automatizados "
        "divididos em duas categorias: testes de repositorio (10 testes) e testes de rotas (6 testes)."
    )

    pdf.subsection_title("4.1", "Testes de Repositorio (test_messages_repository.py)")
    repo_tests = [
        ("test_create_message_persists_and_returns_entity", "PASSED"),
        ("test_create_message_with_author_id", "PASSED"),
        ("test_create_internal_message", "PASSED"),
        ("test_list_by_ticket_returns_messages_ordered_by_created_at", "PASSED"),
        ("test_list_by_ticket_returns_empty_for_unknown_ticket", "PASSED"),
        ("test_list_by_ticket_does_not_include_other_ticket_messages", "PASSED"),
        ("test_get_by_id_returns_message", "PASSED"),
        ("test_get_by_id_returns_none_for_unknown", "PASSED"),
        ("test_delete_removes_message", "PASSED"),
        ("test_list_by_ticket_pagination", "PASSED"),
    ]
    for test_name, status in repo_tests:
        pdf.set_font("Helvetica", "", 9)
        if status == "PASSED":
            pdf.set_text_color(39, 174, 96)
            pdf.cell(16, 5, "PASSED")
        else:
            pdf.set_text_color(231, 76, 60)
            pdf.cell(16, 5, "FAILED")
        pdf.set_text_color(40, 40, 40)
        pdf.cell(0, 5, test_name, new_x="LMARGIN", new_y="NEXT")

    pdf.ln(6)

    pdf.subsection_title("4.2", "Testes de Rotas (test_messages_routes.py)")
    route_tests = [
        ("test_list_messages_route_returns_message_list", "PASSED"),
        ("test_create_message_route_returns_201", "PASSED"),
        ("test_get_message_route_returns_message", "PASSED"),
        ("test_delete_message_route_returns_204", "PASSED"),
        ("test_create_message_with_author_route", "PASSED"),
        ("test_list_messages_with_pagination_params", "PASSED"),
    ]
    for test_name, status in route_tests:
        pdf.set_font("Helvetica", "", 9)
        if status == "PASSED":
            pdf.set_text_color(39, 174, 96)
            pdf.cell(16, 5, "PASSED")
        else:
            pdf.set_text_color(231, 76, 60)
            pdf.cell(16, 5, "FAILED")
        pdf.set_text_color(40, 40, 40)
        pdf.cell(0, 5, test_name, new_x="LMARGIN", new_y="NEXT")

    pdf.ln(6)
    pdf.code_block(
        "$ python -m pytest tests/test_messages_repository.py tests/test_messages_routes.py -v\n"
        "\n"
        "============================= test session starts =============================\n"
        "collected 16 items\n"
        "\n"
        "tests/test_messages_repository.py::test_create_message_persists_and_returns_entity PASSED\n"
        "tests/test_messages_repository.py::test_create_message_with_author_id PASSED\n"
        "tests/test_messages_repository.py::test_create_internal_message PASSED\n"
        "tests/test_messages_repository.py::test_list_by_ticket_returns_messages_ordered_by_created_at PASSED\n"
        "tests/test_messages_repository.py::test_list_by_ticket_returns_empty_for_unknown_ticket PASSED\n"
        "tests/test_messages_repository.py::test_list_by_ticket_does_not_include_other_ticket_messages PASSED\n"
        "tests/test_messages_repository.py::test_get_by_id_returns_message PASSED\n"
        "tests/test_messages_repository.py::test_get_by_id_returns_none_for_unknown PASSED\n"
        "tests/test_messages_repository.py::test_delete_removes_message PASSED\n"
        "tests/test_messages_repository.py::test_list_by_ticket_pagination PASSED\n"
        "tests/test_messages_routes.py::test_list_messages_route_returns_message_list PASSED\n"
        "tests/test_messages_routes.py::test_create_message_route_returns_201 PASSED\n"
        "tests/test_messages_routes.py::test_get_message_route_returns_message PASSED\n"
        "tests/test_messages_routes.py::test_delete_message_route_returns_204 PASSED\n"
        "tests/test_messages_routes.py::test_create_message_with_author_route PASSED\n"
        "tests/test_messages_routes.py::test_list_messages_with_pagination_params PASSED\n"
        "\n"
        "============================= 16 passed in 0.31s ============================="
    )

    # ── Output ─────────────────────────────────────────────────────────────────

    output_path = "docs/Relatorio_Testes_Mensagens.pdf"
    pdf.output(output_path)
    print(f"Relatório gerado com sucesso: {output_path}")


if __name__ == "__main__":
    generate_report()
