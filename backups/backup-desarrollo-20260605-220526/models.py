# models.py - VERSIÓN ACTUALIZADA
from sqlalchemy import Column, Integer, String, Boolean, Date, Text, Float, JSON, ForeignKey
from sqlalchemy.orm import relationship
from database import Base
from datetime import date

class Producto(Base):
    __tablename__ = "productos"
    
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False)
    categoria = Column(String(50))
    descripcion = Column(Text)
    alergenos = Column(JSON, default=[])
    activo = Column(Boolean, default=True)

class Comanda(Base):
    __tablename__ = "comandas"
    
    id = Column(Integer, primary_key=True, index=True)
    codigo = Column(String(4), unique=True, index=True)
    tipo = Column(String(20), default="cocina")  # "cocina" o "logistica"
    
    # Información común
    empresa = Column(String(100), nullable=False)
    responsable = Column(String(100), nullable=False)
    cliente = Column(String(100))
    telefono = Column(String(20))
    direccion = Column(Text)
    pax = Column(Integer, nullable=False)
    
    # Horarios
    hora_salida = Column(String(10))
    hora_entrega = Column(String(10))
    
    # Alergias
    alergia_gluten = Column(Boolean, default=False)
    alergia_lactosa = Column(Boolean, default=False)
    alergia_frutos_secos = Column(Boolean, default=False)
    alergia_marisco = Column(Boolean, default=False)
    es_vegano = Column(Boolean, default=False)
    es_vegetariano = Column(Boolean, default=False)
    sin_alergias = Column(Boolean, default=False)
    alergias_notas = Column(Text)
    
    # Relaciones
    menu_id = Column(Integer, nullable=True)  # ID del menú seleccionado
    relacionada_con = Column(Integer, nullable=True)  # ID de comanda relacionada (cocina-logistica)
    
    estado = Column(String(20), default="pendiente")
    observaciones = Column(Text)
    fecha_creacion = Column(Date, default=date.today)

# Eliminamos las tablas de menús jerárquicos y creamos una más simple
class CategoriaMenu(Base):
    __tablename__ = "categorias_menu"
    
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(50), unique=True, nullable=False)
    orden = Column(Integer, default=0)
    activo = Column(Boolean, default=True)

class MenuEspecifico(Base):
    __tablename__ = "menus_especificos"
    
    id = Column(Integer, primary_key=True, index=True)
    categoria_id = Column(Integer, nullable=False)
    nombre = Column(String(100), nullable=False)
    descripcion = Column(Text)
    items_salados_min = Column(Integer, default=0)
    items_salados_max = Column(Integer, default=0)
    items_postres_min = Column(Integer, default=0)
    items_postres_max = Column(Integer, default=0)
    pax_minimo = Column(Integer, default=1)
    activo = Column(Boolean, default=True)