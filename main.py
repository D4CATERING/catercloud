# main.py - VERSIÓN COMPLETA CON TODAS LAS RUTAS
from fastapi import FastAPI, Depends, HTTPException, Request, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse, RedirectResponse
from sqlalchemy.orm import Session
import models
from database import engine, get_db
from datetime import date
import json
import random
import string

app = FastAPI(title="CaterCloud API")

models.Base.metadata.create_all(bind=engine)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

# ========== FUNCIONES AUXILIARES ==========

def generar_codigo_comanda(db: Session, longitud=4):
    """Genera un código único de 4 dígitos para una comanda"""
    while True:
        caracteres = string.ascii_uppercase + string.digits
        codigo = ''.join(random.choices(caracteres, k=longitud))
        
        existente = db.query(models.Comanda).filter(
            models.Comanda.codigo == codigo
        ).first()
        
        if not existente:
            return codigo

# ========== RUTAS PRINCIPALES (HTML) ==========

@app.get("/", response_class=HTMLResponse)
def read_root(request: Request):
    """Página principal del sistema"""
    return templates.TemplateResponse("index.html", {"request": request})

@app.get("/cocina", response_class=HTMLResponse)
def comanda_cocina(request: Request):
    """Página para crear comanda de cocina"""
    return templates.TemplateResponse("comanda_cocina.html", {"request": request})

@app.get("/logistica", response_class=HTMLResponse)
def comanda_logistica(request: Request):
    """Página para crear comanda de logística"""
    return templates.TemplateResponse("comanda_logistica.html", {"request": request})

# ========== API COMANDA ==========

@app.post("/api/comandas/cocina/")
def crear_comanda_cocina(
    empresa: str = Form(...),
    responsable: str = Form(...),
    pax: int = Form(...),
    hora_salida: str = Form(...),
    alergia_gluten: bool = Form(False),
    alergia_lactosa: bool = Form(False),
    alergia_frutos_secos: bool = Form(False),
    alergia_marisco: bool = Form(False),
    es_vegano: bool = Form(False),
    es_vegetariano: bool = Form(False),
    sin_alergias: bool = Form(False),
    alergias_notas: str = Form(""),
    menu_id: int = Form(None),
    db: Session = Depends(get_db)
):
    """Crea una nueva comanda de cocina"""
    codigo = generar_codigo_comanda(db)
    
    nueva_comanda = models.Comanda(
        codigo=codigo,
        tipo="cocina",
        empresa=empresa,
        responsable=responsable,
        pax=pax,
        hora_salida=hora_salida,
        alergia_gluten=alergia_gluten,
        alergia_lactosa=alergia_lactosa,
        alergia_frutos_secos=alergia_frutos_secos,
        alergia_marisco=alergia_marisco,
        es_vegano=es_vegano,
        es_vegetariano=es_vegetariano,
        sin_alergias=sin_alergias,
        alergias_notas=alergias_notas,
        menu_id=menu_id,
        estado="pendiente",
        fecha_creacion=date.today()
    )
    
    db.add(nueva_comanda)
    db.commit()
    db.refresh(nueva_comanda)
    
    return {
        "message": "Comanda de cocina creada",
        "comanda_id": nueva_comanda.id,
        "comanda_codigo": nueva_comanda.codigo,
        "empresa": nueva_comanda.empresa,
        "redirect": f"/logistica?comanda_cocina_id={nueva_comanda.id}"
    }

@app.post("/api/comandas/logistica/")
def crear_comanda_logistica(
    comanda_cocina_id: int = Form(...),
    cliente: str = Form(...),
    telefono: str = Form(...),
    direccion: str = Form(...),
    hora_entrega: str = Form(...),
    observaciones: str = Form(""),
    db: Session = Depends(get_db)
):
    """Crea una comanda de logística relacionada con una de cocina"""
    # Obtener comanda de cocina
    comanda_cocina = db.query(models.Comanda).filter(
        models.Comanda.id == comanda_cocina_id
    ).first()
    
    if not comanda_cocina:
        raise HTTPException(status_code=404, detail="Comanda de cocina no encontrada")
    
    # Crear comanda de logística con mismo código
    comanda_logistica = models.Comanda(
        codigo=comanda_cocina.codigo,  # Mismo código
        tipo="logistica",
        empresa=comanda_cocina.empresa,
        responsable=comanda_cocina.responsable,
        cliente=cliente,
        telefono=telefono,
        direccion=direccion,
        pax=comanda_cocina.pax,
        hora_salida=comanda_cocina.hora_salida,
        hora_entrega=hora_entrega,
        relacionada_con=comanda_cocina.id,
        alergia_gluten=comanda_cocina.alergia_gluten,
        alergia_lactosa=comanda_cocina.alergia_lactosa,
        alergia_frutos_secos=comanda_cocina.alergia_frutos_secos,
        alergia_marisco=comanda_cocina.alergia_marisco,
        es_vegano=comanda_cocina.es_vegano,
        es_vegetariano=comanda_cocina.es_vegetariano,
        sin_alergias=comanda_cocina.sin_alergias,
        alergias_notas=comanda_cocina.alergias_notas,
        observaciones=observaciones,
        estado="pendiente",
        fecha_creacion=date.today()
    )
    
    db.add(comanda_logistica)
    db.commit()
    db.refresh(comanda_logistica)
    
    return {
        "message": "Comanda de logística creada",
        "comanda_id": comanda_logistica.id,
        "comanda_codigo": comanda_logistica.codigo,
        "empresa": comanda_logistica.empresa
    }

@app.get("/api/comandas/")
def listar_comandas(tipo: str = None, db: Session = Depends(get_db)):
    """Lista todas las comandas, opcionalmente filtradas por tipo"""
    query = db.query(models.Comanda)
    
    if tipo:
        query = query.filter(models.Comanda.tipo == tipo)
    
    return query.order_by(models.Comanda.fecha_creacion.desc()).all()

@app.delete("/api/comandas/{comanda_id}")
def eliminar_comanda(comanda_id: int, db: Session = Depends(get_db)):
    """Elimina una comanda"""
    comanda = db.query(models.Comanda).filter(models.Comanda.id == comanda_id).first()
    
    if not comanda:
        raise HTTPException(status_code=404, detail="Comanda no encontrada")
    
    # Si es de logística y tiene relación, no eliminar la de cocina
    if comanda.tipo == "logistica" and comanda.relacionada_con:
        # Solo eliminar esta comanda de logística
        db.delete(comanda)
        db.commit()
        return {"message": "Comanda de logística eliminada"}
    
    # Si es de cocina, eliminar también las relacionadas
    if comanda.tipo == "cocina":
        # Buscar comandas de logística relacionadas
        relacionadas = db.query(models.Comanda).filter(
            models.Comanda.relacionada_con == comanda.id
        ).all()
        
        for relacionada in relacionadas:
            db.delete(relacionada)
    
    db.delete(comanda)
    db.commit()
    
    return {"message": "Comanda eliminada correctamente"}

@app.get("/api/comandas/{comanda_id}")
def obtener_comanda(comanda_id: int, db: Session = Depends(get_db)):
    """Obtiene los detalles de una comanda"""
    comanda = db.query(models.Comanda).filter(models.Comanda.id == comanda_id).first()
    
    if not comanda:
        raise HTTPException(status_code=404, detail="Comanda no encontrada")
    
    return comanda

@app.put("/api/comandas/{comanda_id}")
def actualizar_comanda(
    comanda_id: int,
    empresa: str = Form(None),
    responsable: str = Form(None),
    cliente: str = Form(None),
    telefono: str = Form(None),
    direccion: str = Form(None),
    pax: int = Form(None),
    hora_salida: str = Form(None),
    hora_entrega: str = Form(None),
    observaciones: str = Form(None),
    estado: str = Form(None),
    db: Session = Depends(get_db)
):
    """Actualiza una comanda existente"""
    comanda = db.query(models.Comanda).filter(models.Comanda.id == comanda_id).first()
    
    if not comanda:
        raise HTTPException(status_code=404, detail="Comanda no encontrada")
    
    # Actualizar solo los campos proporcionados
    if empresa is not None:
        comanda.empresa = empresa
    if responsable is not None:
        comanda.responsable = responsable
    if cliente is not None:
        comanda.cliente = cliente
    if telefono is not None:
        comanda.telefono = telefono
    if direccion is not None:
        comanda.direccion = direccion
    if pax is not None:
        comanda.pax = pax
    if hora_salida is not None:
        comanda.hora_salida = hora_salida
    if hora_entrega is not None:
        comanda.hora_entrega = hora_entrega
    if observaciones is not None:
        comanda.observaciones = observaciones
    if estado is not None:
        comanda.estado = estado
    
    db.commit()
    db.refresh(comanda)
    
    return {
        "message": "Comanda actualizada",
        "comanda_id": comanda.id,
        "comanda_codigo": comanda.codigo
    }

# ========== API MENÚS ==========

@app.get("/api/menus/categorias/")
def listar_categorias(db: Session = Depends(get_db)):
    """Lista categorías de menú"""
    return db.query(models.CategoriaMenu).filter(
        models.CategoriaMenu.activo == True
    ).order_by(models.CategoriaMenu.orden).all()

@app.get("/api/menus/{categoria_id}/menus/")
def listar_menus_por_categoria(categoria_id: int, db: Session = Depends(get_db)):
    """Lista menús por categoría"""
    return db.query(models.MenuEspecifico).filter(
        models.MenuEspecifico.categoria_id == categoria_id,
        models.MenuEspecifico.activo == True
    ).all()

@app.get("/api/menus/init-data/")
def inicializar_datos_menu(db: Session = Depends(get_db)):
    """Inicializa datos de menús"""
    
    # Crear categorías
    categorias = [
        {"nombre": "Desayunos", "orden": 1},
        {"nombre": "Foodbox/Comida", "orden": 2},
        {"nombre": "Servicios", "orden": 3},
    ]
    
    categoria_ids = {}
    for cat_data in categorias:
        existente = db.query(models.CategoriaMenu).filter(
            models.CategoriaMenu.nombre == cat_data["nombre"]
        ).first()
        
        if not existente:
            categoria = models.CategoriaMenu(**cat_data)
            db.add(categoria)
            db.flush()
            categoria_ids[cat_data["nombre"]] = categoria.id
        else:
            categoria_ids[cat_data["nombre"]] = existente.id
    
    # Crear menús para Desayunos
    menus_desayunos = [
        {"categoria_id": categoria_ids["Desayunos"], "nombre": "Desayuno Healthy", "descripcion": "Opción saludable"},
        {"categoria_id": categoria_ids["Desayunos"], "nombre": "Desayuno Classic", "descripcion": "Desayuno tradicional"},
        {"categoria_id": categoria_ids["Desayunos"], "nombre": "Desayuno Premium", "descripcion": "Desayuno gourmet"},
        {"categoria_id": categoria_ids["Desayunos"], "nombre": "Desayuno Veggie", "descripcion": "Desayuno vegetariano"},
    ]
    
    # Crear menús para Foodbox/Comida
    menus_foodbox = [
        {"categoria_id": categoria_ids["Foodbox/Comida"], "nombre": "ElEconomico", "descripcion": "7 salados + 1 postre", "items_salados_min": 7, "items_salados_max": 7, "items_postres_min": 1, "items_postres_max": 1},
        {"categoria_id": categoria_ids["Foodbox/Comida"], "nombre": "ElDeEnMedio", "descripcion": "10 salados + 3 postres", "items_salados_min": 10, "items_salados_max": 10, "items_postres_min": 3, "items_postres_max": 3},
        {"categoria_id": categoria_ids["Foodbox/Comida"], "nombre": "ElMuyTop", "descripcion": "12 salados + 3 postres", "items_salados_min": 12, "items_salados_max": 12, "items_postres_min": 3, "items_postres_max": 3},
    ]
    
    # Crear menús para Servicios
    menus_servicios = [
        {"categoria_id": categoria_ids["Servicios"], "nombre": "Afterwork", "descripcion": "Selección de 6 items", "items_salados_min": 6, "items_salados_max": 6},
        {"categoria_id": categoria_ids["Servicios"], "nombre": "Networking", "descripcion": "Selección de 6 items", "items_salados_min": 6, "items_salados_max": 6},
        {"categoria_id": categoria_ids["Servicios"], "nombre": "VinoEspañol", "descripcion": "Selección de 7 items", "items_salados_min": 7, "items_salados_max": 7},
        {"categoria_id": categoria_ids["Servicios"], "nombre": "CoctelDecuatro", "descripcion": "Selección de 9 items", "items_salados_min": 9, "items_salados_max": 9},
        {"categoria_id": categoria_ids["Servicios"], "nombre": "Alucinancia", "descripcion": "Selección de 12 items", "items_salados_min": 12, "items_salados_max": 12},
        {"categoria_id": categoria_ids["Servicios"], "nombre": "Atractividad", "descripcion": "Selección de 17 items", "items_salados_min": 17, "items_salados_max": 17},
    ]
    
    todos_menus = menus_desayunos + menus_foodbox + menus_servicios
    
    for menu_data in todos_menus:
        existente = db.query(models.MenuEspecifico).filter(
            models.MenuEspecifico.nombre == menu_data["nombre"],
            models.MenuEspecifico.categoria_id == menu_data["categoria_id"]
        ).first()
        
        if not existente:
            menu = models.MenuEspecifico(**menu_data)
            db.add(menu)
    
    db.commit()
    
    return {
        "message": "Datos de menús inicializados",
        "categorias": len(categorias),
        "menus": len(todos_menus)
    }

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "CaterCloud"}

# ========== RUN SERVER ==========

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)