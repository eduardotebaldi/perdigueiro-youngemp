-- Create enum for proposal type
CREATE TYPE public.tipo_proposta AS ENUM ('compra', 'parceria', 'mista');

-- Add tipo column to propostas table
ALTER TABLE public.propostas
ADD COLUMN tipo public.tipo_proposta NOT NULL DEFAULT 'compra';