'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Filter, X, Calendar, TrendingUp, Eye } from 'lucide-react';

export interface FilterState {
  search: string;
  auditStatus: string;
  hasClicks: string;
  minClicks: string;
  hasImpressions: string;
  minImpressions: string;
  hasKeyword: string;
  sortBy: string;
}

interface DashboardFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  resultCount: number;
  totalPosts: number;
}

export function DashboardFilters({
  filters,
  onFiltersChange,
  resultCount,
  totalPosts,
}: DashboardFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const updateFilter = (key: keyof FilterState, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      search: '',
      auditStatus: 'all',
      hasClicks: 'all',
      minClicks: '',
      hasImpressions: 'all',
      minImpressions: '',
      hasKeyword: 'all',
      sortBy: 'none',
    });
  };

  const hasActiveFilters = Object.values(filters).some(value => 
    value !== '' && value !== 'all' && value !== 'none'
  );

  const getActiveFiltersCount = () => {
    return Object.values(filters).filter(value => 
      value !== '' && value !== 'all' && value !== 'none'
    ).length;
  };

  return (
    <div className="space-y-4 bg-white p-4 rounded-lg border">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-medium">Filtros</h3>
          {hasActiveFilters && (
            <Badge variant="secondary" className="text-xs">
              {getActiveFiltersCount()} activos
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {resultCount} de {totalPosts} artículos
          </span>
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              className="h-8 px-2 text-xs"
            >
              <X className="h-3 w-3 mr-1" />
              Limpiar
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Búsqueda general */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por título o keyword..."
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Estado de auditoría */}
        <Select value={filters.auditStatus} onValueChange={(value) => updateFilter('auditStatus', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Estado auditoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="audited">Auditados</SelectItem>
            <SelectItem value="pending">Pendientes</SelectItem>
            <SelectItem value="rewritten">Reescritos</SelectItem>
            <SelectItem value="redirected">Redirigidos</SelectItem>
          </SelectContent>
        </Select>

        {/* Tiene clicks */}
        <Select value={filters.hasClicks} onValueChange={(value) => updateFilter('hasClicks', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Clicks" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="yes">Con clicks</SelectItem>
            <SelectItem value="no">Sin clicks</SelectItem>
          </SelectContent>
        </Select>

        {/* Tiene keyword */}
        <Select value={filters.hasKeyword} onValueChange={(value) => updateFilter('hasKeyword', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Keyword" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="yes">Con keyword</SelectItem>
            <SelectItem value="no">Sin keyword</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Filtros avanzados */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-xs"
        >
          {showAdvanced ? 'Ocultar' : 'Mostrar'} filtros avanzados
        </Button>
      </div>

      {showAdvanced && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t">
          {/* Clicks mínimos */}
          <div>
            <Input
              type="number"
              placeholder="Clicks mínimos"
              value={filters.minClicks}
              onChange={(e) => updateFilter('minClicks', e.target.value)}
              min="0"
            />
          </div>

          {/* Impresiones */}
          <Select value={filters.hasImpressions} onValueChange={(value) => updateFilter('hasImpressions', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Impresiones" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="yes">Con impresiones</SelectItem>
              <SelectItem value="no">Sin impresiones</SelectItem>
            </SelectContent>
          </Select>

          {/* Impresiones mínimas */}
          <div>
            <Input
              type="number"
              placeholder="Impresiones mínimas"
              value={filters.minImpressions}
              onChange={(e) => updateFilter('minImpressions', e.target.value)}
              min="0"
            />
          </div>

          {/* Ordenar por */}
          <Select value={filters.sortBy} onValueChange={(value) => updateFilter('sortBy', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Ordenar por</SelectItem>
              <SelectItem value="clicks-desc">Más clicks</SelectItem>
              <SelectItem value="clicks-asc">Menos clicks</SelectItem>
              <SelectItem value="impressions-desc">Más impresiones</SelectItem>
              <SelectItem value="impressions-asc">Menos impresiones</SelectItem>
              <SelectItem value="pageviews-desc">Más vistas</SelectItem>
              <SelectItem value="pageviews-asc">Menos vistas</SelectItem>
              <SelectItem value="date-desc">Más reciente</SelectItem>
              <SelectItem value="date-asc">Más antiguo</SelectItem>
              <SelectItem value="modified-desc">Modificado reciente</SelectItem>
              <SelectItem value="modified-asc">Modificado antiguo</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}