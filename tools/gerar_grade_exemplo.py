#!/usr/bin/env python3
"""Gera tests/amostra-grade.pdf: um PDF de mentira (dados inventados) com o mesmo desenho da "Minha grade horária" do
portal da UFRJ, para testar a leitura em src/js/40-importar-grade.js sem guardar dados de ninguém."""
import os
from reportlab.pdfgen import canvas
H = 595
# como o PDF do portal: página em pé (595 × 842; o reportlab troca os lados com o giro) com /Rotate 90, o texto escrito girado; quem vê, vê deitada
def t(c, x, y, s, size=8, bold=False):
    c.saveState(); c.translate(y + 7, x); c.rotate(90)
    c.setFont('Helvetica-Bold' if bold else 'Helvetica', size); c.drawString(0, 0, s); c.restoreState()
aqui = os.path.dirname(os.path.abspath(__file__))
c = canvas.Canvas(os.path.join(aqui, '..', 'tests', 'amostra-grade.pdf'), pagesize=(842, H))
c.setPageRotation(90)
t(c, 32, 30, 'MINHA GRADE HORÁRIA', 12, True); t(c, 32, 56, 'PARA 2026/2', 11, True); t(c, 32, 70, 'GRADUAÇÃO', 10)
t(c, 590, 20, 'Centro', 8, True); t(c, 590, 30, 'Centro de Ciencias Matematicas e da Natureza')
t(c, 590, 45, 'Unidade', 8, True); t(c, 590, 55, 'Instituto de Computação')
t(c, 590, 70, 'Curso', 8, True); t(c, 590, 80, '00000 - Ciência da Computação')
t(c, 32, 110, 'Aluno', 8, True); t(c, 32, 121, 'ALUNO DE EXEMPLO'); t(c, 307, 110, 'Matrícula', 8, True); t(c, 307, 121, '100000000')
for x, s in [(35, 'Turma'), (79, 'Código'), (129, 'Nome da Turma'), (302, 'C.H. semanal'), (375, 'Créditos'), (431, 'Dia'), (487, 'Horário'), (560, 'Professor(a)')]:
    t(c, x, 153, s, 8, True)
def dia(y, d, a, b): t(c, 430, y, d); t(c, 487, y, a + ' às ' + b)
def cls(y, turma, cod, nome, ch, cred, prof):
    t(c, 38, y, turma); t(c, 78, y, cod); t(c, 129, y, nome); t(c, 326, y, ch); t(c, 384, y, cred); t(c, 560, y, prof)
dia(167, 'Quinta', '10:00', '12:00'); cls(168, '7032', 'ICP145', 'Habilidades Sociais p Trabalho', '2', '2.0', 'PROFESSORA UM')
dia(181, 'Segunda', '10:00', '12:00'); cls(182, '16059', 'MAE111', 'Cálculo Infinitesimal 1 - Turma 2', '6', '6.0', 'PROFESSOR DOIS')
dia(193, 'Quarta', '10:00', '12:00'); dia(205, 'Sexta', '10:00', '12:00')
dia(217, 'Terça', '13:00', '15:00'); cls(218, '6101', 'ICP143', 'Projeto Prático', '2', '2.0', 'PROFESSOR TRES')
dia(231, 'Quarta', '08:00', '10:00'); cls(232, '6675', 'ICP141', 'Programação de Computadores II', '4', '4.0', 'PROFESSORA QUATRO')
dia(243, 'Sexta', '08:00', '10:00')
dia(255, 'Terça', '10:00', '12:00'); cls(256, '5999', 'ICP142', 'Organização de Dados I', '2', '2.0', 'PROFESSOR CINCO')
cls(270, '4927', 'ICPZ55', 'Ativ Curricular Extensão - Bcc 2026-1', '21', '0.0', 'PROFESSOR SEIS')
dia(283, 'Terça', '08:00', '10:00'); cls(284, '6677', 'ICP144', 'Matemática Discreta', '4', '4.0', 'PROFESSOR SETE')
dia(295, 'Quinta', '08:00', '10:00')
t(c, 225, 308, 'Total'); t(c, 261, 308, '-------------->'); t(c, 324, 308, '41'); t(c, 382, 308, '20.0')
t(c, 32, 380, 'Orientador Acadêmico: PROFESSOR EXEMPLO')
c.save()
