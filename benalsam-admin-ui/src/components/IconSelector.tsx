import React, { useState } from 'react';
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  Grid,
  Typography,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  Search,
  Smartphone,
  Car,
  Home,
  User,
  ShoppingCart,
  Book,
  Camera,
  Heart,
  Gift,
  Tag,
  Music,
  Gamepad2,
  Utensils,
  Wrench,
  Palette,
  Leaf,
  Zap,
  Star,
  Globe,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Clock,
  Settings,
  Folder,
  File,
  Image,
  Video,
  Headphones,
  Monitor,
  Laptop,
  Tablet,
  Watch,
  Speaker,
  Keyboard,
  Mouse,
  Printer,
  Router,
  Wifi,
  Battery,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Download,
  Upload,
  Share,
  Plus,
  Minus,
  Check,
  X,
  AlertCircle,
  Info,
  HelpCircle,
  Shield,
  Award,
  Trophy,
  Medal,
  Crown,
  Diamond,
  Gem,
  Sparkles,
  Snowflake,
  Sun,
  Moon,
  Cloud,
  Wind,
  Umbrella,
  Trees,
  Flower,
  Bug,
  Bird,
  Dog,
  Cat,
} from 'lucide-react';

// İkon listesi - sadece gerçekten mevcut olanları
const ICON_OPTIONS = [
  { name: 'Smartphone', icon: Smartphone },
  { name: 'Car', icon: Car },
  { name: 'Home', icon: Home },
  { name: 'User', icon: User },
  { name: 'ShoppingCart', icon: ShoppingCart },
  { name: 'Book', icon: Book },
  { name: 'Camera', icon: Camera },
  { name: 'Heart', icon: Heart },
  { name: 'Gift', icon: Gift },
  { name: 'Tag', icon: Tag },
  { name: 'Music', icon: Music },
  { name: 'Gamepad2', icon: Gamepad2 },
  { name: 'Utensils', icon: Utensils },
  { name: 'Wrench', icon: Wrench },
  { name: 'Palette', icon: Palette },
  { name: 'Leaf', icon: Leaf },
  { name: 'Zap', icon: Zap },
  { name: 'Star', icon: Star },
  { name: 'Globe', icon: Globe },
  { name: 'MapPin', icon: MapPin },
  { name: 'Phone', icon: Phone },
  { name: 'Mail', icon: Mail },
  { name: 'Calendar', icon: Calendar },
  { name: 'Clock', icon: Clock },
  { name: 'Settings', icon: Settings },
  { name: 'Folder', icon: Folder },
  { name: 'File', icon: File },
  { name: 'Image', icon: Image },
  { name: 'Video', icon: Video },
  { name: 'Headphones', icon: Headphones },
  { name: 'Monitor', icon: Monitor },
  { name: 'Laptop', icon: Laptop },
  { name: 'Tablet', icon: Tablet },
  { name: 'Watch', icon: Watch },
  { name: 'Speaker', icon: Speaker },
  { name: 'Keyboard', icon: Keyboard },
  { name: 'Mouse', icon: Mouse },
  { name: 'Printer', icon: Printer },
  { name: 'Router', icon: Router },
  { name: 'Wifi', icon: Wifi },
  { name: 'Battery', icon: Battery },
  { name: 'Lock', icon: Lock },
  { name: 'Unlock', icon: Unlock },
  { name: 'Eye', icon: Eye },
  { name: 'EyeOff', icon: EyeOff },
  { name: 'Download', icon: Download },
  { name: 'Upload', icon: Upload },
  { name: 'Share', icon: Share },
  { name: 'Plus', icon: Plus },
  { name: 'Minus', icon: Minus },
  { name: 'Check', icon: Check },
  { name: 'X', icon: X },
  { name: 'AlertCircle', icon: AlertCircle },
  { name: 'Info', icon: Info },
  { name: 'HelpCircle', icon: HelpCircle },
  { name: 'Shield', icon: Shield },
  { name: 'Award', icon: Award },
  { name: 'Trophy', icon: Trophy },
  { name: 'Medal', icon: Medal },
  { name: 'Crown', icon: Crown },
  { name: 'Diamond', icon: Diamond },
  { name: 'Gem', icon: Gem },
  { name: 'Sparkles', icon: Sparkles },
  { name: 'Snowflake', icon: Snowflake },
  { name: 'Sun', icon: Sun },
  { name: 'Moon', icon: Moon },
  { name: 'Cloud', icon: Cloud },
  { name: 'Wind', icon: Wind },
  { name: 'Umbrella', icon: Umbrella },
  { name: 'Trees', icon: Trees },
  { name: 'Flower', icon: Flower },
  { name: 'Bug', icon: Bug },
  { name: 'Bird', icon: Bird },
  { name: 'Dog', icon: Dog },
  { name: 'Cat', icon: Cat },
];

interface IconSelectorProps {
  open: boolean;
  onClose: () => void;
  onSelect: (iconName: string) => void;
  selectedIcon?: string;
}

export const IconSelector: React.FC<IconSelectorProps> = ({
  open,
  onClose,
  onSelect,
  selectedIcon,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredIcons = ICON_OPTIONS.filter(icon =>
    icon.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleIconSelect = (iconName: string) => {
    onSelect(iconName);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          margin: { xs: 2, sm: 'auto' },
          width: { xs: 'calc(100% - 32px)', sm: 'auto' },
          maxWidth: { xs: '100%', sm: '900px' }
        }
      }}
    >
      <DialogTitle>
        🎨 İkon Seçici - Kategori için ikon seçin
      </DialogTitle>
      <DialogContent>
        <TextField
          fullWidth
          label="🔍 İkon Ara"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="İkon adı yazın (örn: Car, Home, Music)"
          InputProps={{
            startAdornment: <InputAdornment position="start"><Search size={20} /></InputAdornment>,
          }}
          sx={{ mb: 3 }}
        />
        
        <Grid container spacing={1}>
          {filteredIcons.map((iconOption) => {
            const IconComponent = iconOption.icon;
            const isSelected = selectedIcon === iconOption.name;
            
            return (
              <Grid item xs={6} sm={4} md={3} lg={2} xl={1} key={iconOption.name}>
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    p: { xs: 1, sm: 1.5 },
                    border: '2px solid',
                    borderColor: isSelected ? 'primary.main' : 'divider',
                    borderRadius: 2,
                    cursor: 'pointer',
                    backgroundColor: isSelected ? 'primary.light' : 'transparent',
                    transition: 'all 0.2s ease',
                    minHeight: { xs: '80px', sm: '100px' },
                    '&:hover': {
                      backgroundColor: isSelected ? 'primary.light' : 'action.hover',
                      transform: 'translateY(-2px)',
                      boxShadow: 2,
                    },
                  }}
                  onClick={() => handleIconSelect(iconOption.name)}
                >
                  <IconComponent size={28} color={isSelected ? '#1976d2' : undefined} />
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      mt: 1, 
                      textAlign: 'center',
                      fontWeight: isSelected ? 'bold' : 'normal',
                      color: isSelected ? 'primary.main' : 'text.secondary',
                      fontSize: { xs: '0.7rem', sm: '0.75rem' },
                      lineHeight: 1.2
                    }}
                  >
                    {iconOption.name}
                  </Typography>
                </Box>
              </Grid>
            );
          })}
        </Grid>
      </DialogContent>
    </Dialog>
  );
}; 