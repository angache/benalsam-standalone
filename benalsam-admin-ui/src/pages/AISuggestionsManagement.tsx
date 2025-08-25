import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Card,
  CardContent,
  CardHeader,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Alert,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import { Add as AddIcon, Refresh as RefreshIcon, ExpandMore as ExpandMoreIcon } from '@mui/icons-material';

interface CategoryAISuggestion {
  id: number;
  categoryId: number;
  suggestionType: 'title' | 'description' | 'attributes' | 'keywords';
  suggestionData: any;
  confidenceScore: number;
  isApproved: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Category {
  id: number;
  name: string;
  path?: string;
  parent_id?: number;
  level: number;
  subcategories?: Category[];
}

const AISuggestionsManagement: React.FC = () => {
  const [suggestions, setSuggestions] = useState<CategoryAISuggestion[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryTree, setCategoryTree] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedCategoryName, setSelectedCategoryName] = useState<string>('');
  const [selectedSuggestionType, setSelectedSuggestionType] = useState<string>('keywords');
  const [suggestionText, setSuggestionText] = useState('');
  const [confidenceScore, setConfidenceScore] = useState<number>(80);
  const [isApproved, setIsApproved] = useState(true);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Fetch categories
  useEffect(() => {
    fetchCategories();
  }, []);

  // Fetch suggestions when category changes
  useEffect(() => {
    if (selectedCategory) {
      fetchSuggestions(selectedCategory);
    }
  }, [selectedCategory]);

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/categories`);
      const data = await response.json();
      if (data.success) {
        setCategories(data.data);
        setCategoryTree(data.data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      setMessage({ text: 'Kategoriler yüklenirken hata oluştu', type: 'error' });
    }
  };

  const fetchSuggestions = async (categoryId: number) => {
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/categories/${categoryId}/ai-suggestions`);
      const data = await response.json();
      if (data.success) {
        setSuggestions(data.data.suggestions);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setMessage({ text: 'AI önerileri yüklenirken hata oluştu', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const createSuggestion = async () => {
    if (!selectedCategory || !suggestionText.trim()) {
      setMessage({ text: 'Lütfen kategori seçin ve öneri metni girin', type: 'error' });
      return;
    }

    try {
      const suggestionData = {
        suggestions: suggestionText.split(',').map(s => s.trim())
      };

      const response = await fetch(`${import.meta.env.VITE_API_URL}/categories/${selectedCategory}/ai-suggestions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          suggestionType: selectedSuggestionType,
          suggestionData,
          confidenceScore: confidenceScore / 100,
          isApproved
        })
      });

      const data = await response.json();
      if (data.success) {
        setMessage({ text: 'AI önerisi başarıyla oluşturuldu', type: 'success' });
        fetchSuggestions(selectedCategory);
        setSuggestionText('');
      }
    } catch (error) {
      console.error('Error creating suggestion:', error);
      setMessage({ text: 'AI önerisi oluşturulurken hata oluştu', type: 'error' });
    }
  };

  const getSuggestionTypeLabel = (type: string) => {
    const labels = {
      title: 'Başlık',
      description: 'Açıklama',
      attributes: 'Özellikler',
      keywords: 'Anahtar Kelimeler'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getSuggestionTypeColor = (type: string) => {
    const colors = {
      title: 'primary',
      description: 'success',
      attributes: 'secondary',
      keywords: 'warning'
    } as const;
    return colors[type as keyof typeof colors] || 'default';
  };

  const handleCategorySelect = (category: Category) => {
    setSelectedCategory(category.id);
    setSelectedCategoryName(category.name);
  };

  const renderCategoryTree = (categories: Category[], level: number = 0) => {
    return categories.map((category) => (
      <Accordion key={category.id} sx={{ ml: level * 2 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              cursor: 'pointer',
              width: '100%',
              p: 1,
              borderRadius: 1,
              '&:hover': { bgcolor: 'action.hover' },
              bgcolor: selectedCategory === category.id ? 'primary.light' : 'transparent',
              color: selectedCategory === category.id ? 'primary.contrastText' : 'inherit'
            }}
            onClick={(e) => {
              e.stopPropagation();
              handleCategorySelect(category);
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: selectedCategory === category.id ? 'bold' : 'normal' }}>
              {category.name}
            </Typography>
          </Box>
        </AccordionSummary>
        {category.subcategories && category.subcategories.length > 0 && (
          <AccordionDetails sx={{ pl: 2 }}>
            {renderCategoryTree(category.subcategories, level + 1)}
          </AccordionDetails>
        )}
      </Accordion>
    ));
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          AI Önerileri Yönetimi
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={() => fetchCategories()}
        >
          Yenile
        </Button>
      </Box>

      {message && (
        <Alert severity={message.type} sx={{ mb: 2 }} onClose={() => setMessage(null)}>
          {message.text}
        </Alert>
      )}

      <Box sx={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 3 }}>
        {/* Kategori Seçimi */}
        <Card>
          <CardHeader title="Kategori Seçimi" />
          <CardContent>
            {selectedCategory && (
              <Alert severity="info" sx={{ mb: 2 }}>
                Seçili: <strong>{selectedCategoryName}</strong>
              </Alert>
            )}
            <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
              {renderCategoryTree(categoryTree)}
            </Box>
          </CardContent>
        </Card>

        {/* AI Önerisi Oluşturma */}
        <Card>
          <CardHeader title="Yeni AI Önerisi Oluştur" />
          <CardContent>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Öneri Tipi</InputLabel>
                <Select
                  value={selectedSuggestionType}
                  onChange={(e) => setSelectedSuggestionType(e.target.value)}
                  label="Öneri Tipi"
                >
                  <MenuItem value="keywords">Anahtar Kelimeler</MenuItem>
                  <MenuItem value="title">Başlık</MenuItem>
                  <MenuItem value="description">Açıklama</MenuItem>
                  <MenuItem value="attributes">Özellikler</MenuItem>
                </Select>
              </FormControl>

              <TextField
                fullWidth
                type="number"
                label="Güven Skoru (%)"
                value={confidenceScore}
                onChange={(e) => setConfidenceScore(Number(e.target.value))}
                inputProps={{ min: 0, max: 100 }}
              />
            </Box>

            <TextField
              fullWidth
              multiline
              rows={3}
              label="Öneri Metni"
              placeholder="Önerileri virgülle ayırarak girin..."
              value={suggestionText}
              onChange={(e) => setSuggestionText(e.target.value)}
              sx={{ mb: 2 }}
            />

            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={createSuggestion}
              fullWidth
              disabled={!selectedCategory}
            >
              AI Önerisi Oluştur
            </Button>
          </CardContent>
        </Card>
      </Box>

      {/* Mevcut Öneriler */}
      <Card sx={{ mt: 3 }}>
        <CardHeader title="AI Önerilerini Yönet" />
        <CardContent>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : suggestions.length === 0 ? (
            <Alert severity="info">
              Seçili kategoride AI önerisi bulunamadı
            </Alert>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Tip</TableCell>
                    <TableCell>Öneri</TableCell>
                    <TableCell>Güven Skoru</TableCell>
                    <TableCell>Durum</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {suggestions.map((suggestion) => (
                    <TableRow key={suggestion.id}>
                      <TableCell>
                        <Chip
                          label={getSuggestionTypeLabel(suggestion.suggestionType)}
                          color={getSuggestionTypeColor(suggestion.suggestionType)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {Array.isArray(suggestion.suggestionData.suggestions) 
                            ? suggestion.suggestionData.suggestions.join(', ')
                            : JSON.stringify(suggestion.suggestionData)
                          }
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={`${Math.round(suggestion.confidenceScore * 100)}%`}
                          variant="outlined"
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={suggestion.isApproved ? "Onaylı" : "Beklemede"}
                          color={suggestion.isApproved ? "success" : "default"}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default AISuggestionsManagement;
