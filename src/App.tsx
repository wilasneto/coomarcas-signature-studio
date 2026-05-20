import React, { useState, useRef, ChangeEvent } from 'react';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { 
  Download, 
  User, 
  Briefcase, 
  Phone, 
  Mail, 
  Globe, 
  MapPin, 
  Instagram, 
  Facebook, 
  Linkedin, 
  Twitter, 
  Youtube,
  Upload, 
  Check, 
  ChevronDown,
  RefreshCw,
  Image as ImageIcon,
  FileSpreadsheet,
  Layers,
  CheckCircle2,
  AlertCircle,
  FileDown,
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';

interface SignatureData {
  name: string;
  role: string;
  company: string;
  phone: string;
  email: string;
  website: string;
  location: string;
  photo: string | null;
  brandLogo: string | null;
  secondaryLogo: string | null;
  layout?: LayoutType;
  photoX: number;
  photoY: number;
  photoScale: number;
  logoX?: number;
  logoY?: number;
  logoScale?: number;
  secLogoX?: number;
  secLogoY?: number;
  secLogoScale?: number;
  socials: {
    linkedin?: string;
    instagram?: string;
    facebook?: string;
    twitter?: string;
    youtube?: string;
  };
  socialVisibility?: {
    instagram: boolean;
    facebook: boolean;
    linkedin: boolean;
    youtube: boolean;
  };
  coomarcasSubLogos?: (string | null)[];
  coomarcasSubLogosX?: number[];
  coomarcasSubLogosY?: number[];
  coomarcasSubLogosScale?: number[];
  contactIconBgColor?: string;
  contactIconColor?: string;
  rightBgType?: 'solid' | 'gradient';
  rightBgColor?: string;
  rightBgGradient1?: string;
  rightBgGradient2?: string;
  photoBorderColor?: string;
  photoBgColor?: string;
}

type LayoutType = 'farmacon' | 'pets' | 'rxanalises' | 'coomarcas' | 'mercaddo' | 'integree';

const DEFAULT_DATA: SignatureData = {
  name: 'Guilherme Batista',
  role: 'CONTÁBIL',
  company: 'Farmacon',
  phone: '(21) 97180-1049',
  email: 'guilherme.rodriguez@farmacon.com.br',
  website: 'www.farmacon.com.br',
  location: '@farmacontabilidade',
  photo: null,
  brandLogo: null,
  secondaryLogo: null,
  photoX: 0,
  photoY: 0,
  photoScale: 1,
  logoX: 0,
  logoY: 0,
  logoScale: 1,
  secLogoX: 0,
  secLogoY: 0,
  secLogoScale: 1,
  socials: {
    linkedin: 'linkedin.com',
    instagram: 'instagram.com',
    facebook: 'facebook.com',
    twitter: '',
    youtube: 'youtube.com'
  },
  socialVisibility: {
    instagram: true,
    facebook: true,
    linkedin: true,
    youtube: true
  },
  coomarcasSubLogos: [null, null, null, null],
  coomarcasSubLogosX: [0, 0, 0, 0],
  coomarcasSubLogosY: [0, 0, 0, 0],
  coomarcasSubLogosScale: [1, 1, 1, 1],
  rightBgType: 'solid',
  rightBgColor: '#ffffff',
  rightBgGradient1: '#ffffff',
  rightBgGradient2: '#f4f4f5',
  photoBorderColor: '#ffffff',
  photoBgColor: '#f4f4f5'
};

function convertCloudImageUrl(url: string | null | undefined): string | null {
  if (!url || typeof url !== 'string') return url ?? null;
  const trimmedUrl = url.trim();

  // 1. Google Drive
  const gdRegex1 = /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/i;
  const gdRegex2 = /(?:drive|docs)\.google\.com\/.*[?&]id=([a-zA-Z0-9_-]+)/i;

  let fileId: string | null = null;
  const m1 = trimmedUrl.match(gdRegex1);
  const m2 = trimmedUrl.match(gdRegex2);

  if (m1) {
    fileId = m1[1];
  } else if (m2) {
    fileId = m2[1];
  }

  if (fileId) {
    return `https://docs.google.com/uc?export=download&id=${fileId}`;
  }

  // 2. OneDrive
  if (trimmedUrl.includes('onedrive.live.com')) {
    if (trimmedUrl.includes('redir?')) {
      return trimmedUrl.replace('redir?', 'download?');
    }
    if (trimmedUrl.includes('embed?')) {
      return trimmedUrl.replace('embed?', 'download?');
    }
    try {
      const urlObj = new URL(trimmedUrl);
      const resid = urlObj.searchParams.get('resid');
      const authkey = urlObj.searchParams.get('authkey');
      if (resid) {
        let downloadUrl = `https://onedrive.live.com/download?resid=${resid}`;
        if (authkey) downloadUrl += `&authkey=${authkey}`;
        return downloadUrl;
      }
    } catch (e) {
      // ignore parsing error
    }
  }

  // 3. Dropbox
  if (trimmedUrl.includes('dropbox.com')) {
    if (trimmedUrl.includes('dl=0')) {
      return trimmedUrl.replace('dl=0', 'raw=1');
    }
    if (!trimmedUrl.includes('raw=1') && !trimmedUrl.includes('dl=1')) {
      const separator = trimmedUrl.includes('?') ? '&' : '?';
      return trimmedUrl + separator + 'raw=1';
    }
  }

  return trimmedUrl;
}

export default function App() {
  const [activeLayout, setActiveLayout] = useState<LayoutType>('farmacon');
  const [brandLogos, setBrandLogos] = useState<Record<LayoutType, string | null>>(() => {
    try {
      const saved = localStorage.getItem('signature_brand_logos');
      return saved ? JSON.parse(saved) : {
        farmacon: null, pets: null, rxanalises: null, coomarcas: null, mercaddo: null, integree: null
      };
    } catch (e) {
      return { farmacon: null, pets: null, rxanalises: null, coomarcas: null, mercaddo: null, integree: null };
    }
  });

  const [socialVisibilities, setSocialVisibilities] = useState<Record<LayoutType, SignatureData['socialVisibility']>>(() => {
    try {
      const saved = localStorage.getItem('signature_social_visibilities');
      return saved ? JSON.parse(saved) : {
        farmacon: { ...DEFAULT_DATA.socialVisibility },
        pets: { ...DEFAULT_DATA.socialVisibility },
        rxanalises: { ...DEFAULT_DATA.socialVisibility },
        coomarcas: { ...DEFAULT_DATA.socialVisibility },
        mercaddo: { ...DEFAULT_DATA.socialVisibility },
        integree: { ...DEFAULT_DATA.socialVisibility }
      };
    } catch (e) {
      const defaultVis = { ...DEFAULT_DATA.socialVisibility };
      return {
        farmacon: defaultVis, pets: defaultVis, rxanalises: defaultVis, coomarcas: defaultVis, mercaddo: defaultVis, integree: defaultVis
      } as any;
    }
  });

  const [photoError, setPhotoError] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [secLogoError, setSecLogoError] = useState(false);

  const [secondaryLogos, setSecondaryLogos] = useState<Record<LayoutType, string | null>>(() => {
    try {
      const saved = localStorage.getItem('signature_secondary_logos');
      return saved ? JSON.parse(saved) : {
        farmacon: null, pets: null, rxanalises: null, coomarcas: null, mercaddo: null, integree: null
      };
    } catch (e) {
      return { farmacon: null, pets: null, rxanalises: null, coomarcas: null, mercaddo: null, integree: null };
    }
  });

  const [coomarcasGlobalSubLogos, setCoomarcasGlobalSubLogos] = useState<(string | null)[]>(() => {
    try {
      const saved = localStorage.getItem('signature_coomarcas_sub_logos');
      return saved ? JSON.parse(saved) : [null, null, null, null];
    } catch (e) {
      return [null, null, null, null];
    }
  });

  const [data, setData] = useState<SignatureData>({
    ...DEFAULT_DATA,
    brandLogo: brandLogos['farmacon'],
    secondaryLogo: secondaryLogos['farmacon'],
    socialVisibility: socialVisibilities['farmacon'],
    coomarcasSubLogos: coomarcasGlobalSubLogos
  });

  // Persistir logotipos no LocalStorage
  React.useEffect(() => {
    localStorage.setItem('signature_brand_logos', JSON.stringify(brandLogos));
  }, [brandLogos]);

  React.useEffect(() => {
    localStorage.setItem('signature_social_visibilities', JSON.stringify(socialVisibilities));
  }, [socialVisibilities]);

  React.useEffect(() => {
    localStorage.setItem('signature_secondary_logos', JSON.stringify(secondaryLogos));
  }, [secondaryLogos]);

  React.useEffect(() => {
    localStorage.setItem('signature_coomarcas_sub_logos', JSON.stringify(coomarcasGlobalSubLogos));
  }, [coomarcasGlobalSubLogos]);

  // Sincronizar logotipo, visibilidade social e sub-logotipos quando a marca muda
  React.useEffect(() => {
    setData(prev => ({ 
      ...prev, 
      brandLogo: brandLogos[activeLayout],
      secondaryLogo: secondaryLogos[activeLayout],
      socialVisibility: socialVisibilities[activeLayout] || DEFAULT_DATA.socialVisibility,
      coomarcasSubLogos: activeLayout === 'coomarcas' 
        ? (prev.coomarcasSubLogos || coomarcasGlobalSubLogos) 
        : (prev.coomarcasSubLogos || [null, null, null, null])
    }));
  }, [activeLayout, brandLogos, secondaryLogos, socialVisibilities, coomarcasGlobalSubLogos]);

  const [isExporting, setIsExporting] = useState(false);
  const [bulkData, setBulkData] = useState<SignatureData[]>([]);
  const [selectedBatchIndex, setSelectedBatchIndex] = useState<number>(-1);
  const [isProcessingBulk, setIsProcessingBulk] = useState(false);
  const [bulkProgress, setBulkProgress] = useState(0);
  const signatureRef = useRef<HTMLDivElement>(null);

  // Sincronizar dados editados de volta para o array bulkData
  const updateBulkDataItem = React.useCallback((newData: SignatureData) => {
    if (selectedBatchIndex >= 0) {
      setBulkData(prev => {
        const updated = [...prev];
        // Evita atualizações desnecessárias se os dados forem idênticos
        if (JSON.stringify(updated[selectedBatchIndex]) === JSON.stringify(newData)) {
          return prev;
        }
        updated[selectedBatchIndex] = newData;
        return updated;
      });
    }
  }, [selectedBatchIndex]);

  // Efeito para sincronizar qualquer mudança no "data" (incluindo arrastes) para o bulkData
  React.useEffect(() => {
    updateBulkDataItem(data);
  }, [data, updateBulkDataItem]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name.startsWith('social_')) {
      const socialKey = name.replace('social_', '');
      setData(prev => ({
        ...prev,
        socials: { ...prev.socials, [socialKey]: value }
      }));
    } else {
      setData(prev => ({ ...prev, [name]: value }));
    }
  };

  const toggleSocialVisibility = (key: keyof Required<SignatureData>['socialVisibility']) => {
    const nextVisibility = {
      instagram: data.socialVisibility?.instagram ?? true,
      facebook: data.socialVisibility?.facebook ?? true,
      linkedin: data.socialVisibility?.linkedin ?? true,
      youtube: data.socialVisibility?.youtube ?? true,
      ...data.socialVisibility,
      [key]: !((data.socialVisibility?.[key]) ?? true)
    };

    setSocialVisibilities(prev => ({
      ...prev,
      [activeLayout]: nextVisibility
    }));

    setData(prev => ({
      ...prev,
      socialVisibility: nextVisibility
    }));
  };

  const handlePhotoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setData(prev => ({ ...prev, photo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBrandLogoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setBrandLogos(prev => ({ ...prev, [activeLayout]: base64 }));
        setData(prev => ({ ...prev, brandLogo: base64 }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSecondaryLogoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setSecondaryLogos(prev => ({ ...prev, [activeLayout]: base64 }));
        setData(prev => ({ ...prev, secondaryLogo: base64 }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCoomarcasSubLogoUpload = (index: number, e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        const newSubLogos = [...(data.coomarcasSubLogos || [null, null, null, null])];
        newSubLogos[index] = base64;
        setCoomarcasGlobalSubLogos(newSubLogos);
        setData(prev => ({ ...prev, coomarcasSubLogos: newSubLogos }));
      };
      reader.readAsDataURL(file);
    }
  };

  const downloadSignature = async () => {
    const canvas = document.getElementById('signature-canvas') as HTMLCanvasElement;
    if (!canvas) return;
    
    setIsExporting(true);
    try {
      const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
      const link = document.createElement('a');
      link.download = `assinatura-${String(data.name).toLowerCase().replace(/\s+/g, '-')}.jpg`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Erro ao baixar imagem:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const downloadTemplate = () => {
    const headers = [
      "Nome e Sobrenome", 
      "Cargo ou Departamento", 
      "Username / Instagram", 
      "Telefone", 
      "Email", 
      "Website / Link", 
      "Modelo (farmacon, pets, rxanalises, coomarcas, mercaddo, integree)",
      "URL da Foto (opcional)"
    ];
    
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers]);
    XLSX.utils.book_append_sheet(wb, ws, "Assinaturas");
    XLSX.writeFile(wb, "Coomarcas_Modelo_Assinaturas.xlsx");
  };

  const handleExcelUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        const wb = XLSX.read(data, { type: 'array' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const items = XLSX.utils.sheet_to_json(ws);

        if (items.length === 0) {
          alert('A planilha parece estar vazia.');
          return;
        }

        const parsedData = items.map((row: any) => ({
          name: row['Nome e Sobrenome'] ? String(row['Nome e Sobrenome']) : '',
          role: row['Cargo ou Departamento'] ? String(row['Cargo ou Departamento']) : '',
          company: DEFAULT_DATA.company,
          phone: row['Telefone'] ? String(row['Telefone']) : '',
          email: row['Email'] ? String(row['Email']) : '',
          website: row['Website / Link'] ? String(row['Website / Link']) : '',
          location: row['Username / Instagram'] ? String(row['Username / Instagram']) : '',
          layout: String(row['Modelo (farmacon, pets, rxanalises, coomarcas, mercaddo, integree)'] || 'farmacon').toLowerCase().trim() as LayoutType,
          photo: row['URL da Foto (opcional)'] ? convertCloudImageUrl(String(row['URL da Foto (opcional)'])) : null,
                    brandLogo: brandLogos[String(row['Modelo (farmacon, pets, rxanalises, coomarcas, mercaddo, integree)'] || 'farmacon').toLowerCase().trim() as LayoutType],
          secondaryLogo: secondaryLogos[String(row['Modelo (farmacon, pets, rxanalises, coomarcas, mercaddo, integree)'] || 'farmacon').toLowerCase().trim() as LayoutType],
          photoX: 0,
          photoY: 0,
          photoScale: 1,
          logoX: 0,
          logoY: 0,
          logoScale: 1,
          secLogoX: 0,
          secLogoY: 0,
          secLogoScale: 1,
          socials: { ...DEFAULT_DATA.socials },
          socialVisibility: { ...DEFAULT_DATA.socialVisibility },
          coomarcasSubLogos: [null, null, null, null],
          rightBgType: 'solid',
          rightBgColor: '#ffffff',
          rightBgGradient1: '#ffffff',
          rightBgGradient2: '#f4f4f5',
          photoBorderColor: '#ffffff',
          photoBgColor: '#f4f4f5'
        }));
        setBulkData(parsedData);
        setSelectedBatchIndex(0);
        // Automatically switch to first item preview
        if (parsedData.length > 0) {
          setData(parsedData[0]);
          if (parsedData[0].layout) setActiveLayout(parsedData[0].layout);
        }
      } catch (err) {
        console.error('Erro ao ler Excel:', err);
        alert('Erro ao ler a planilha. Verifique se o formato está correto.');
      }
    };
    reader.readAsArrayBuffer(file);

    // Reset input so user can choose same file again if edited
    e.target.value = '';
  };

  const selectBatchItem = (index: number) => {
    setSelectedBatchIndex(index);
    const item = bulkData[index];
    const layout = (item.layout || activeLayout) as LayoutType;
    
    setData({
      ...item,
      brandLogo: item.brandLogo || brandLogos[layout],
      secondaryLogo: item.secondaryLogo || secondaryLogos[layout],
      coomarcasSubLogos: item.coomarcasSubLogos || coomarcasGlobalSubLogos || [null, null, null, null]
    });
    
    if (item.layout) setActiveLayout(item.layout);
  };

  const generateBulkSignatures = async () => {
    if (bulkData.length === 0) return;
    
    setIsProcessingBulk(true);
    setBulkProgress(0);
    const zip = new JSZip();
    let capturedCount = 0;

    // Usaremos uma função auxiliar de renderização manual para o lote
    const renderToTempCanvas = (item: SignatureData): Promise<string> => {
      return new Promise(async (resolve) => {
        const canvas = document.createElement('canvas');
        canvas.width = 900;
        canvas.height = 252;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve('');

        // Carrega fotos
        const loadImg = (src: string | null): Promise<HTMLImageElement | null> => {
          return new Promise((res) => {
            if (!src) return res(null);
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => res(img);
            img.onerror = () => res(null);
            img.src = src;
          });
        };

        const profImg = await loadImg(item.photo);
        const layout = (item.layout || activeLayout) as LayoutType;
        const logoImg = await loadImg(item.brandLogo || brandLogos[layout]);
        const secLogoImg = await loadImg(item.secondaryLogo || secondaryLogos[layout]);
        
        const sub1 = item.coomarcasSubLogos?.[0] || (layout === 'coomarcas' ? coomarcasGlobalSubLogos[0] : null);
        const sub2 = item.coomarcasSubLogos?.[1] || (layout === 'coomarcas' ? coomarcasGlobalSubLogos[1] : null);
        const sub3 = item.coomarcasSubLogos?.[2] || (layout === 'coomarcas' ? coomarcasGlobalSubLogos[2] : null);
        const sub4 = item.coomarcasSubLogos?.[3] || (layout === 'coomarcas' ? coomarcasGlobalSubLogos[3] : null);

        const [subImg1, subImg2, subImg3, subImg4] = await Promise.all([
          loadImg(sub1),
          loadImg(sub2),
          loadImg(sub3),
          loadImg(sub4)
        ]);
        
        // Ensure social visibility is respected in bulk export if not provided in item
        const finalItem = {
          ...item,
          socialVisibility: item.socialVisibility || socialVisibilities[layout] || DEFAULT_DATA.socialVisibility
        };
        
        drawSignatureToCanvas(ctx, finalItem, layout, profImg, logoImg, secLogoImg, [subImg1, subImg2, subImg3, subImg4]);
        resolve(canvas.toDataURL('image/jpeg', 0.92));
      });
    };
    
    try {
      for (let i = 0; i < bulkData.length; i++) {
        const item = bulkData[i];
        const dataUrl = await renderToTempCanvas(item);
        
        if (dataUrl && dataUrl.length > 1000) {
          const base64Data = dataUrl.split(',')[1];
          const folderName = item.layout || activeLayout;
          const layoutFolder = zip.folder(folderName);
          
          const cleanName = String(item.name || `assinatura-${i+1}`)
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]/g, '-');
          
          layoutFolder?.file(`${cleanName}.jpg`, base64Data, {base64: true});
          capturedCount++;
        }
        
        setBulkProgress(Math.round(((i + 1) / bulkData.length) * 100));
      }

      if (capturedCount > 0) {
        const content = await zip.generateAsync({ type: "blob" });
        saveAs(content, `lote_assinaturas_${new Date().getTime()}.zip`);
        alert(`${capturedCount} assinaturas geradas com sucesso!`);
      }
    } catch (err) {
      console.error('Erro no processamento:', err);
    } finally {
      setIsProcessingBulk(false);
      setBulkProgress(0);
    }
  };

  const currentStyles = getThemeStyles(activeLayout);

  return (
    <div className="min-h-screen bg-slate-50/50 text-zinc-900 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Top Header */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-8 flex flex-col md:flex-row md:items-center justify-between shadow-sm">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-800">Coomarcas Signature Studio</h1>
            <p className="text-zinc-500 mt-1">Crie sua assinatura profissional em segundos</p>
          </div>
          <div className="flex items-center gap-4 mt-6 md:mt-0">
            <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Layout</label>
            <div className="relative">
              <select 
                value={activeLayout}
                onChange={(e) => setActiveLayout(e.target.value as LayoutType)}
                className="appearance-none bg-zinc-50 border border-zinc-200 rounded-xl pl-5 pr-12 py-3 text-sm font-semibold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none cursor-pointer transition-all min-w-[240px]"
                style={{ borderColor: activeLayout === 'farmacon' ? '#4e84e7' : undefined }}
              >
                <option value="farmacon">Farmacon</option>
                <option value="pets">Pets</option>
                <option value="rxanalises">Rx Análises</option>
                <option value="coomarcas">Coomarcas</option>
                <option value="mercaddo">Mercaddo</option>
                <option value="integree">Integree</option>
              </select>
              <ChevronDown className="w-5 h-5 text-zinc-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Action & Main Content Area */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* Left Side: Form & Download Toggle */}
          <div className="w-full lg:w-[480px] flex-shrink-0 flex flex-col gap-8">
            <div 
              className="rounded-2xl p-8 flex flex-col items-center justify-center gap-6 shadow-xl shadow-blue-900/10"
              style={{ backgroundColor: currentStyles.primary }}
            >
              <button 
                onClick={downloadSignature}
                disabled={isExporting}
                className="w-full flex items-center justify-center gap-3 bg-white px-8 py-5 rounded-2xl font-black hover:bg-zinc-50 transition-all shadow-md active:scale-[0.98] disabled:opacity-70"
                style={{ color: currentStyles.primary }}
              >
                {isExporting ? <RefreshCw className="w-6 h-6 animate-spin" /> : <Download className="w-6 h-6" />}
                BAIXAR ASSINATURA
              </button>
              <button
                onClick={() => setData(DEFAULT_DATA)}
                className="text-white/70 hover:text-white text-xs font-black uppercase flex items-center gap-2 transition-colors tracking-widest"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Resetar Dados
              </button>
            </div>

            <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm flex flex-col gap-8 overflow-y-auto max-h-[700px] no-scrollbar">
              <div className="space-y-8">
                {/* Bulk Actions Section */}
                <section className="space-y-6">
                  <h2 className="text-xs font-black uppercase tracking-widest text-zinc-400 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-zinc-50 flex items-center justify-center">
                      <Layers className="w-4.5 h-4.5 text-zinc-500" />
                    </div>
                    Processamento em Massa
                  </h2>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <button 
                        onClick={downloadTemplate}
                        className="flex flex-col items-center justify-center gap-3 p-6 bg-white border border-zinc-200 rounded-3xl hover:border-blue-400 hover:bg-blue-50/50 transition-all group shadow-sm active:scale-95"
                      >
                        <div className="w-10 h-10 rounded-2xl bg-zinc-100 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                          <FileDown className="w-5 h-5 text-zinc-400 group-hover:text-blue-600" />
                        </div>
                        <div className="text-center">
                          <p className="text-xs font-black uppercase tracking-wider text-zinc-600 group-hover:text-blue-700">Baixar Modelo</p>
                          <p className="text-[10px] text-zinc-400 group-hover:text-blue-500 font-bold uppercase tracking-tighter mt-1">Excel .xlsx</p>
                        </div>
                      </button>

                      <div className="relative group">
                        <div className="flex flex-col items-center justify-center gap-3 p-6 bg-white border-2 border-dashed border-zinc-200 rounded-3xl hover:border-blue-400 hover:bg-blue-50/50 transition-all group shadow-sm cursor-pointer h-full">
                          <div className="w-10 h-10 rounded-2xl bg-zinc-100 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                            <FileSpreadsheet className="w-5 h-5 text-zinc-400 group-hover:text-blue-600" />
                          </div>
                          <div className="text-center">
                            <p className="text-xs font-black uppercase tracking-wider text-zinc-600 group-hover:text-blue-700">Subir Planilha</p>
                            <p className="text-[10px] text-zinc-400 group-hover:text-blue-500 font-bold uppercase tracking-tighter mt-1">Processar Lote</p>
                          </div>
                          <input 
                            type="file" 
                            accept=".xlsx, .xls" 
                            onChange={handleExcelUpload} 
                            className="absolute inset-0 opacity-0 cursor-pointer" 
                          />
                        </div>
                      </div>
                    </div>

                    {bulkData.length > 0 && (
                      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-blue-600" />
                            <span className="text-sm font-bold text-blue-900">{bulkData.length} registros no lote</span>
                          </div>
                          <button 
                            onClick={() => {
                              setBulkData([]);
                              setSelectedBatchIndex(-1);
                            }}
                            className="text-[10px] font-black text-blue-600 hover:text-blue-800 uppercase tracking-widest"
                          >
                            Limpar Lote
                          </button>
                        </div>

                        {/* List of Batch Items */}
                        <div className="max-h-48 overflow-y-auto no-scrollbar space-y-2 border-y border-blue-100 py-3">
                          {bulkData.map((item, idx) => (
                            <button
                              key={idx}
                              onClick={() => selectBatchItem(idx)}
                              className={cn(
                                "w-full flex items-center justify-between p-3 rounded-xl transition-all text-left",
                                selectedBatchIndex === idx 
                                  ? "bg-white border border-blue-200 shadow-sm ring-2 ring-blue-500/10" 
                                  : "hover:bg-white/50"
                              )}
                            >
                              <div className="flex items-center gap-3">
                                <div className={cn(
                                  "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold",
                                  selectedBatchIndex === idx ? "bg-blue-600 text-white" : "bg-blue-100 text-blue-600"
                                )}>
                                  {idx + 1}
                                </div>
                                <div className="truncate">
                                  <p className="text-xs font-bold text-zinc-700 truncate w-40">{item.name || 'Sem nome'}</p>
                                  <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-tighter truncate w-40">{item.role}</p>
                                </div>
                              </div>
                              {selectedBatchIndex === idx && <Check className="w-3 h-3 text-blue-600" />}
                            </button>
                          ))}
                        </div>
                        
                        <div className="p-3 bg-white border border-blue-100 rounded-xl">
                          <p className="text-[10px] text-blue-700 font-bold uppercase text-center leading-relaxed">
                            Selecione acima cada item para ajustar a foto individualmente antes de exportar o lote completo.
                          </p>
                        </div>
                        
                        {isProcessingBulk ? (
                          <div className="space-y-3">
                            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest" style={{ color: currentStyles.primary }}>
                              <span>{bulkProgress === 99 ? 'Finalizando ZIP...' : `Processando (${bulkProgress}%)`}</span>
                              <RefreshCw className="w-3 h-3 animate-spin" />
                            </div>
                            <div className="w-full h-3 rounded-full overflow-hidden border" style={{ backgroundColor: currentStyles.accent, borderColor: currentStyles.primary + '20' }}>
                              <motion.div 
                                className="h-full"
                                style={{ backgroundColor: currentStyles.primary }}
                                initial={{ width: 0 }}
                                animate={{ width: `${bulkProgress}%` }}
                                transition={{ type: 'spring', damping: 20, stiffness: 100 }}
                              />
                            </div>
                            <p className="text-[9px] text-zinc-400 text-center font-bold uppercase tracking-wider">
                              Por favor, não feche a aba
                            </p>
                          </div>
                        ) : (
                          <button 
                            onClick={generateBulkSignatures}
                            className="w-full py-4 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
                            style={{ backgroundColor: currentStyles.primary }}
                          >
                            <Download className="w-4 h-4" /> Gerar Todas em ZIP
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </section>

                <section className="space-y-6">
                  <h2 className="text-xs font-black uppercase tracking-widest text-zinc-400 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-zinc-50 flex items-center justify-center">
                      <User className="w-4.5 h-4.5 text-zinc-500" />
                    </div>
                    Dados Pessoais
                  </h2>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-zinc-500 ml-1 uppercase tracking-wider">Nome Completo</label>
                      <input name="name" value={data.name} onChange={handleInputChange} className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-5 py-4 text-base font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-zinc-500 ml-1 uppercase tracking-wider">Cargo ou Departamento</label>
                      <input name="role" value={data.role} onChange={handleInputChange} className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-5 py-4 text-base font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-zinc-500 ml-1 uppercase tracking-wider">Username / Instagram</label>
                      <input name="location" value={data.location} onChange={handleInputChange} className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-5 py-4 text-base font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all" />
                    </div>
                  </div>
                </section>
                <section className="space-y-6">
                  <h2 className="text-xs font-black uppercase tracking-widest text-zinc-400 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-zinc-50 flex items-center justify-center">
                      <Phone className="w-4.5 h-4.5 text-zinc-500" />
                    </div>
                    Contato
                  </h2>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-zinc-500 ml-1 uppercase tracking-wider">Telefone</label>
                      <input name="phone" value={data.phone} onChange={handleInputChange} className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-5 py-4 text-base font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-zinc-500 ml-1 uppercase tracking-wider">E-mail</label>
                      <input name="email" value={data.email} onChange={handleInputChange} className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-5 py-4 text-base font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-zinc-500 ml-1 uppercase tracking-wider">Website / Link</label>
                      <input name="website" value={data.website} onChange={handleInputChange} className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-5 py-4 text-base font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all" />
                    </div>
                    
                    {/* Controle para Modificar as Cores dos Ícones de Contato */}
                    <div className="pt-4 border-t border-zinc-200/50 space-y-4">
                      <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block ml-1">Cores dos Ícones de Contato</span>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-zinc-500 ml-1 uppercase tracking-wider block">Fundo (Círculo)</label>
                          <div className="flex items-center gap-2">
                            <div className="relative w-10 h-10 rounded-xl border border-zinc-200 flex-shrink-0 overflow-hidden shadow-sm">
                              <input 
                                type="color" 
                                value={data.contactIconBgColor || currentStyles.accent} 
                                onChange={(e) => setData(prev => ({ ...prev, contactIconBgColor: e.target.value }))}
                                className="absolute inset-0 w-[200%] h-[200%] -translate-x-1/4 -translate-y-1/4 cursor-pointer border-0 p-0"
                              />
                            </div>
                            <input 
                              type="text" 
                              value={data.contactIconBgColor || ''} 
                              placeholder={currentStyles.accent}
                              onChange={(e) => setData(prev => ({ ...prev, contactIconBgColor: e.target.value || undefined }))} 
                              className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs font-mono outline-none focus:border-blue-500 uppercase"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-zinc-500 ml-1 uppercase tracking-wider block">Símbolo (Desenho)</label>
                          <div className="flex items-center gap-2">
                            <div className="relative w-10 h-10 rounded-xl border border-zinc-200 flex-shrink-0 overflow-hidden shadow-sm">
                              <input 
                                type="color" 
                                value={data.contactIconColor || '#ffffff'} 
                                onChange={(e) => setData(prev => ({ ...prev, contactIconColor: e.target.value }))}
                                className="absolute inset-0 w-[200%] h-[200%] -translate-x-1/4 -translate-y-1/4 cursor-pointer border-0 p-0"
                              />
                            </div>
                            <input 
                              type="text" 
                              value={data.contactIconColor || ''} 
                              placeholder="#ffffff"
                              onChange={(e) => setData(prev => ({ ...prev, contactIconColor: e.target.value || undefined }))}
                              className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs font-mono outline-none focus:border-blue-500 uppercase"
                            />
                          </div>
                        </div>
                      </div>
                      {(data.contactIconBgColor || data.contactIconColor) && (
                        <button 
                          onClick={() => setData(prev => ({ ...prev, contactIconBgColor: undefined, contactIconColor: undefined }))}
                          className="text-[9px] font-black text-red-500 hover:text-red-600 uppercase tracking-widest block ml-1 transition-colors"
                        >
                          Limpar Cores Personalizadas
                        </button>
                      )}
                    </div>
                  </div>
                </section>
                <section className="space-y-6">
                  <h2 className="text-xs font-black uppercase tracking-widest text-zinc-400 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-zinc-50 flex items-center justify-center">
                      <Instagram className="w-4.5 h-4.5 text-zinc-500" />
                    </div>
                    Redes Sociais (Ícones)
                  </h2>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { key: 'instagram', label: 'Instagram', icon: <Instagram className="w-4 h-4" /> },
                      { key: 'facebook', label: 'Facebook', icon: <Facebook className="w-4 h-4" /> },
                      { key: 'linkedin', label: 'LinkedIn', icon: <Linkedin className="w-4 h-4" /> },
                      { key: 'youtube', label: 'YouTube', icon: <Youtube className="w-4 h-4" /> },
                    ].map((item) => (
                      <button
                        key={item.key}
                        onClick={() => toggleSocialVisibility(item.key as any)}
                        className={cn(
                          "flex items-center gap-3 p-4 rounded-2xl border transition-all",
                          (data.socialVisibility?.[item.key as keyof Required<SignatureData>['socialVisibility']] ?? true)
                            ? "bg-white border-zinc-200 shadow-sm text-zinc-700"
                            : "bg-zinc-50 border-transparent text-zinc-400 grayscale opacity-50"
                        )}
                      >
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                          (data.socialVisibility?.[item.key as keyof Required<SignatureData>['socialVisibility']] ?? true)
                            ? "bg-zinc-100 text-zinc-600"
                            : "bg-zinc-200 text-zinc-400"
                        )}>
                          {item.icon}
                        </div>
                        <span className="text-xs font-bold uppercase tracking-wider">{item.label}</span>
                        <div className="ml-auto">
                          {(data.socialVisibility?.[item.key as keyof Required<SignatureData>['socialVisibility']] ?? true) ? (
                            <Check className="w-4 h-4 text-green-500" />
                          ) : (
                            <div className="w-4 h-4 border-2 border-zinc-200 rounded-full" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </section>

                <section className="space-y-6">
                  <h2 className="text-xs font-black uppercase tracking-widest text-zinc-400 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-zinc-50 flex items-center justify-center">
                      <Layers className="w-4.5 h-4.5 text-zinc-500" />
                    </div>
                    Plano de Fundo (Direita)
                  </h2>
                  <div className="space-y-4">
                    {/* Toggle between Sólido and Degradê */}
                    <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-100 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setData(prev => ({ ...prev, rightBgType: 'solid' }))}
                        className={cn(
                          "py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all",
                          (data.rightBgType || 'solid') === 'solid'
                            ? "bg-white text-zinc-800 shadow-sm"
                            : "text-zinc-500 hover:text-zinc-800"
                        )}
                      >
                        Cor Sólida
                      </button>
                      <button
                        type="button"
                        onClick={() => setData(prev => ({ ...prev, rightBgType: 'gradient' }))}
                        className={cn(
                          "py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all",
                          (data.rightBgType || 'solid') === 'gradient'
                            ? "bg-white text-zinc-800 shadow-sm"
                            : "text-zinc-500 hover:text-zinc-800"
                        )}
                      >
                        Degradê
                      </button>
                    </div>

                    {(data.rightBgType || 'solid') === 'solid' ? (
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-zinc-500 ml-1 uppercase tracking-wider block">Cor de Fundo</label>
                        <div className="flex items-center gap-2">
                          <div className="relative w-10 h-10 rounded-xl border border-zinc-200 flex-shrink-0 overflow-hidden shadow-sm">
                            <input 
                              type="color" 
                              value={data.rightBgColor || '#ffffff'} 
                              onChange={(e) => setData(prev => ({ ...prev, rightBgColor: e.target.value }))}
                              className="absolute inset-0 w-[200%] h-[200%] -translate-x-1/4 -translate-y-1/4 cursor-pointer border-0 p-0"
                            />
                          </div>
                          <input 
                            type="text" 
                            value={data.rightBgColor || '#ffffff'} 
                            onChange={(e) => setData(prev => ({ ...prev, rightBgColor: e.target.value }))}
                            className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs font-mono outline-none focus:border-blue-500 uppercase font-bold"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-zinc-500 ml-1 uppercase tracking-wider block">Cor 1 (Início)</label>
                          <div className="flex items-center gap-2">
                            <div className="relative w-9 h-9 rounded-xl border border-zinc-200 flex-shrink-0 overflow-hidden shadow-sm">
                              <input 
                                type="color" 
                                value={data.rightBgGradient1 || '#ffffff'} 
                                onChange={(e) => setData(prev => ({ ...prev, rightBgGradient1: e.target.value }))}
                                className="absolute inset-0 w-[200%] h-[200%] -translate-x-1/4 -translate-y-1/4 cursor-pointer border-0 p-0"
                              />
                            </div>
                            <input 
                              type="text" 
                              value={data.rightBgGradient1 || '#ffffff'} 
                              onChange={(e) => setData(prev => ({ ...prev, rightBgGradient1: e.target.value }))}
                              className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-2 py-1.5 text-[10px] font-mono outline-none focus:border-blue-500 uppercase font-bold"
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-zinc-500 ml-1 uppercase tracking-wider block">Cor 2 (Fim)</label>
                          <div className="flex items-center gap-2">
                            <div className="relative w-9 h-9 rounded-xl border border-zinc-200 flex-shrink-0 overflow-hidden shadow-sm">
                              <input 
                                type="color" 
                                value={data.rightBgGradient2 || '#f4f4f5'} 
                                onChange={(e) => setData(prev => ({ ...prev, rightBgGradient2: e.target.value }))}
                                className="absolute inset-0 w-[200%] h-[200%] -translate-x-1/4 -translate-y-1/4 cursor-pointer border-0 p-0"
                              />
                            </div>
                            <input 
                              type="text" 
                              value={data.rightBgGradient2 || '#f4f4f5'} 
                              onChange={(e) => setData(prev => ({ ...prev, rightBgGradient2: e.target.value }))}
                              className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-2 py-1.5 text-[10px] font-mono outline-none focus:border-blue-500 uppercase font-bold"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {((data.rightBgType || 'solid') === 'gradient' || (data.rightBgColor && data.rightBgColor.toLowerCase() !== '#ffffff')) && (
                      <button 
                        onClick={() => setData(prev => ({ 
                          ...prev, 
                          rightBgType: 'solid', 
                          rightBgColor: '#ffffff',
                          rightBgGradient1: '#ffffff',
                          rightBgGradient2: '#f4f4f5'
                        }))}
                        className="text-[9px] font-black text-red-500 hover:text-red-600 uppercase tracking-widest block ml-1 transition-colors"
                      >
                        Resetar Plano de Fundo
                      </button>
                    )}
                  </div>
                </section>

                <section className="space-y-6">
                  <h2 className="text-xs font-black uppercase tracking-widest text-zinc-400 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-zinc-50 flex items-center justify-center">
                      <ImageIcon className="w-4.5 h-4.5 text-zinc-500" />
                    </div>
                    Foto de Perfil
                  </h2>
                  <div className="space-y-6">
                    <div className="p-8 border-2 border-dashed border-zinc-200 rounded-3xl flex flex-col items-center justify-center bg-zinc-50 hover:bg-zinc-100 transition-colors cursor-pointer group relative">
                      <div className="w-20 h-20 rounded-full bg-white border border-zinc-200 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform overflow-hidden shadow-sm relative">
                        {data.photo ? (
                          <img 
                            src={data.photo} 
                            alt="Preview" 
                            className="w-full h-full object-cover" 
                            onError={() => setPhotoError(true)}
                            onLoad={() => setPhotoError(false)}
                          />
                        ) : (
                          <Upload className="w-8 h-8 text-zinc-400" />
                        )}
                        {photoError && data.photo && (
                          <div className="absolute inset-0 bg-red-50/90 flex flex-col items-center justify-center p-2 text-center">
                            <AlertCircle className="w-5 h-5 text-red-500 mb-1" />
                            <span className="text-[8px] font-black text-red-600 leading-tight uppercase">Bloqueio CORS ou Link Inválido</span>
                          </div>
                        )}
                      </div>
                      <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Toque para carregar arquivo</p>
                      <input type="file" accept="image/*" onChange={handlePhotoUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                    </div>

                    <div className="space-y-4">
                       <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Ou cole o link da foto</label>
                        <input 
                          type="text" 
                          placeholder="https://exemplo.com/foto.jpg"
                          value={data.photo && data.photo.startsWith('http') ? data.photo : ''}
                          onChange={(e) => {
                            setPhotoError(false);
                            const converted = convertCloudImageUrl(e.target.value);
                            setData(prev => ({ ...prev, photo: converted }));
                          }}
                          className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-5 py-3 text-sm font-medium outline-none focus:border-blue-500 transition-all shadow-inner"
                        />
                       </div>

                       {data.photo && (
                         data.photo.includes('docs.google.com/uc') || 
                         data.photo.includes('onedrive.live.com/download') || 
                         (data.photo.includes('dropbox.com') && data.photo.includes('raw=1'))
                       ) && (
                         <div className="bg-emerald-50 border border-emerald-100 p-3.5 rounded-2xl flex gap-2.5 items-center">
                           <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                             <Check className="w-3.5 h-3.5 text-white" />
                           </div>
                           <div className="flex-1">
                             <p className="text-[10px] text-emerald-950 font-black uppercase tracking-wider leading-none mb-0.5">Link Convertido!</p>
                             <p className="text-[9px] text-emerald-800 leading-normal font-medium">
                               Detectamos um link de serviço de nuvem e o convertemos automaticamente para carregamento direto.
                             </p>
                           </div>
                         </div>
                       )}

                       <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex gap-3">
                          <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                          <div className="space-y-1">
                            <p className="text-[10px] font-black text-amber-900 uppercase tracking-wider leading-tight">Dica para links SharePoint/Drive:</p>
                            <p className="text-[10px] text-amber-800 leading-relaxed font-medium">
                              Links do navegador não funcionam devido ao bloqueio de segurança (CORS). Você deve usar o <b>Link de Download Direto</b> ou o código de <b>Incorporação (Embed)</b> para que a imagem apareça.
                            </p>
                          </div>
                       </div>

                       {/* Cores do Bloco da Foto */}
                       <div className="pt-4 border-t border-zinc-200/50 space-y-4">
                         <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block ml-1">Cores da Moldura da Foto</span>
                         <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-2">
                             <label className="text-[10px] font-bold text-zinc-500 ml-1 uppercase tracking-wider block">Borda / Moldura</label>
                             <div className="flex items-center gap-2">
                               <div className="relative w-10 h-10 rounded-xl border border-zinc-200 flex-shrink-0 overflow-hidden shadow-sm">
                                 <input 
                                   type="color" 
                                   value={data.photoBorderColor || '#ffffff'} 
                                   onChange={(e) => setData(prev => ({ ...prev, photoBorderColor: e.target.value }))}
                                   className="absolute inset-0 w-[200%] h-[200%] -translate-x-1/4 -translate-y-1/4 cursor-pointer border-0 p-0"
                                 />
                               </div>
                               <input 
                                 type="text" 
                                 value={data.photoBorderColor || ''} 
                                 placeholder="#ffffff"
                                 onChange={(e) => setData(prev => ({ ...prev, photoBorderColor: e.target.value || undefined }))} 
                                 className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs font-mono outline-none focus:border-blue-500 uppercase font-bold"
                               />
                             </div>
                           </div>

                           <div className="space-y-2">
                             <label className="text-[10px] font-bold text-zinc-500 ml-1 uppercase tracking-wider block">Fundo do Quadrado</label>
                             <div className="flex items-center gap-2">
                               <div className="relative w-10 h-10 rounded-xl border border-zinc-200 flex-shrink-0 overflow-hidden shadow-sm">
                                 <input 
                                   type="color" 
                                   value={data.photoBgColor || '#f4f4f5'} 
                                   onChange={(e) => setData(prev => ({ ...prev, photoBgColor: e.target.value }))}
                                   className="absolute inset-0 w-[200%] h-[200%] -translate-x-1/4 -translate-y-1/4 cursor-pointer border-0 p-0"
                                 />
                               </div>
                               <input 
                                 type="text" 
                                 value={data.photoBgColor || ''} 
                                 placeholder="#f4f4f5"
                                 onChange={(e) => setData(prev => ({ ...prev, photoBgColor: e.target.value || undefined }))} 
                                 className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs font-mono outline-none focus:border-blue-500 uppercase font-bold"
                               />
                             </div>
                           </div>
                         </div>

                         {(data.photoBorderColor || data.photoBgColor) && (
                           <button 
                             onClick={() => setData(prev => ({ ...prev, photoBorderColor: undefined, photoBgColor: undefined }))}
                             className="text-[9px] font-black text-red-500 hover:text-red-600 uppercase tracking-widest block ml-1 transition-colors"
                           >
                             Resetar Cores da Foto
                           </button>
                         )}
                       </div>
                    </div>
                    
                    <div className="pt-6 border-t border-zinc-100 space-y-8">
                      <div>
                        <label className="text-xs font-bold text-zinc-500 ml-1 uppercase tracking-wider mb-4 block">Logotipo Principal</label>
                        <div className="flex flex-col gap-4">
                          <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-zinc-50 border border-zinc-200 rounded-xl flex items-center justify-center relative overflow-hidden group flex-shrink-0">
                               {data.brandLogo ? (
                                 <img 
                                  src={data.brandLogo} 
                                  alt="Logo" 
                                  className="w-full h-full object-contain p-2" 
                                  onError={() => setLogoError(true)}
                                  onLoad={() => setLogoError(false)}
                                />
                               ) : (
                                 <ImageIcon className="w-6 h-6 text-zinc-300" />
                               )}
                               {logoError && data.brandLogo && (
                                  <div className="absolute inset-0 bg-red-50/90 flex flex-col items-center justify-center p-1 text-center">
                                    <AlertCircle className="w-4 h-4 text-red-500 mb-0.5" />
                                    <span className="text-[7px] font-black text-red-600 leading-tight uppercase">Erro no Link</span>
                                  </div>
                                )}
                               <input type="file" accept="image/*" onChange={handleBrandLogoUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                            </div>
                            <div className="flex-1 space-y-2">
                              <p className="text-[10px] text-zinc-400 font-bold uppercase leading-tight">Escolha o arquivo ou cole o link:</p>
                              <input 
                                type="text" 
                                placeholder="URL do Logotipo"
                                value={data.brandLogo && data.brandLogo.startsWith('http') ? data.brandLogo : ''}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setLogoError(false);
                                  setBrandLogos(prev => ({ ...prev, [activeLayout]: val }));
                                  setData(prev => ({ ...prev, brandLogo: val }));
                                }}
                                className="w-full bg-white border border-zinc-200 rounded-lg px-4 py-2 text-xs outline-none focus:border-blue-500 transition-all"
                              />
                            </div>
                          </div>
                          {data.brandLogo && (
                            <div className="flex flex-col gap-4">
                              <button 
                                onClick={() => {
                                  setBrandLogos(prev => ({ ...prev, [activeLayout]: null }));
                                  setData(prev => ({ ...prev, brandLogo: null }));
                                }}
                                className="text-[10px] font-black text-red-500 hover:text-red-600 uppercase tracking-widest self-start ml-20"
                              >
                                Remover Logo
                              </button>

                              <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 space-y-3">
                                <div className="flex items-center gap-2 mb-1">
                                  <RefreshCw className="w-3 h-3 text-blue-600" />
                                  <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500 animate-pulse">Ajustes do Logotipo Principal</span>
                                </div>
                                <div className="space-y-3">
                                  {/* Zoom */}
                                  <div className="space-y-1">
                                    <div className="flex items-center justify-between">
                                      <label className="text-[9px] font-bold text-zinc-400 uppercase">Zoom / Tamanho</label>
                                      <span className="text-[9px] font-bold text-blue-600">{Math.round((data.logoScale ?? 1) * 100)}%</span>
                                    </div>
                                    <input 
                                      type="range" 
                                      min="0.2" 
                                      max="3" 
                                      step="0.01" 
                                      value={data.logoScale ?? 1} 
                                      onChange={(e) => setData(prev => ({ ...prev, logoScale: parseFloat(e.target.value) }))}
                                      className="w-full h-1 bg-zinc-200 rounded-full appearance-none cursor-pointer accent-blue-600"
                                    />
                                  </div>
                                  {/* X Offset */}
                                  <div className="space-y-1">
                                    <div className="flex items-center justify-between">
                                      <label className="text-[9px] font-bold text-zinc-400 uppercase">Mover Horizontal (X)</label>
                                      <span className="text-[9px] font-bold text-zinc-500">{Math.round(data.logoX ?? 0)}px</span>
                                    </div>
                                    <input 
                                      type="range" 
                                      min="-200" 
                                      max="200" 
                                      step="1" 
                                      value={data.logoX ?? 0} 
                                      onChange={(e) => setData(prev => ({ ...prev, logoX: parseFloat(e.target.value) }))}
                                      className="w-full h-1 bg-zinc-200 rounded-full appearance-none cursor-pointer accent-zinc-500"
                                    />
                                  </div>
                                  {/* Y Offset */}
                                  <div className="space-y-1">
                                    <div className="flex items-center justify-between">
                                      <label className="text-[9px] font-bold text-zinc-400 uppercase">Mover Vertical (Y)</label>
                                      <span className="text-[9px] font-bold text-zinc-500">{Math.round(data.logoY ?? 0)}px</span>
                                    </div>
                                    <input 
                                      type="range" 
                                      min="-100" 
                                      max="100" 
                                      step="1" 
                                      value={data.logoY ?? 0} 
                                      onChange={(e) => setData(prev => ({ ...prev, logoY: parseFloat(e.target.value) }))}
                                      className="w-full h-1 bg-zinc-200 rounded-full appearance-none cursor-pointer accent-zinc-500"
                                    />
                                  </div>
                                </div>
                                <button 
                                  onClick={() => setData(prev => ({ ...prev, logoX: 0, logoY: 0, logoScale: 1 }))}
                                  className="w-full text-[9px] font-bold uppercase tracking-widest py-2 bg-white border border-zinc-200 text-zinc-400 hover:text-zinc-600 rounded-lg transition-all"
                                >
                                  Resetar Ajustes
                                </button>
                                <p className="text-[8px] text-zinc-400 text-center italic mt-1 font-sans">
                                  Você também pode clicar e arrastar o logotipo diretamente no banner!
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="pt-6 border-t border-zinc-100 uppercase">
                        <label className="text-xs font-bold text-zinc-500 ml-1 uppercase tracking-wider mb-4 block">Logotipo Secundário / Selo</label>
                        <div className="flex flex-col gap-4">
                          <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-zinc-50 border border-zinc-200 rounded-xl flex items-center justify-center relative overflow-hidden group flex-shrink-0">
                               {data.secondaryLogo ? (
                                 <img 
                                  src={data.secondaryLogo} 
                                  alt="Logo Secundário" 
                                  className="w-full h-full object-contain p-2" 
                                  onError={() => setSecLogoError(true)}
                                  onLoad={() => setSecLogoError(false)}
                                />
                               ) : (
                                 <div className="flex flex-col items-center gap-1 opacity-20">
                                   <Plus className="w-4 h-4 text-zinc-500" />
                                   <ImageIcon className="w-5 h-5 text-zinc-500" />
                                 </div>
                               )}
                               {secLogoError && data.secondaryLogo && (
                                  <div className="absolute inset-0 bg-red-50/90 flex flex-col items-center justify-center p-1 text-center">
                                    <AlertCircle className="w-4 h-4 text-red-500 mb-0.5" />
                                    <span className="text-[7px] font-black text-red-600 leading-tight uppercase">Erro no Link</span>
                                  </div>
                                )}
                               <input type="file" accept="image/*" onChange={handleSecondaryLogoUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                            </div>
                            <div className="flex-1 space-y-2">
                              <p className="text-[10px] text-zinc-400 font-bold uppercase leading-tight">Escolha o arquivo ou cole o link:</p>
                              <input 
                                type="text" 
                                placeholder="URL do Selo"
                                value={data.secondaryLogo && data.secondaryLogo.startsWith('http') ? data.secondaryLogo : ''}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setSecLogoError(false);
                                  setSecondaryLogos(prev => ({ ...prev, [activeLayout]: val }));
                                  setData(prev => ({ ...prev, secondaryLogo: val }));
                                }}
                                className="w-full bg-white border border-zinc-200 rounded-lg px-4 py-2 text-xs outline-none focus:border-blue-500 transition-all"
                              />
                            </div>
                          </div>
                          {data.secondaryLogo && (
                            <div className="flex flex-col gap-4">
                              <button 
                                onClick={() => {
                                  setSecondaryLogos(prev => ({ ...prev, [activeLayout]: null }));
                                  setData(prev => ({ ...prev, secondaryLogo: null }));
                                }}
                                className="text-[10px] font-black text-red-500 hover:text-red-600 uppercase tracking-widest self-start ml-20"
                              >
                                Remover Selo
                              </button>

                              <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 space-y-3">
                                <div className="flex items-center gap-2 mb-1">
                                  <RefreshCw className="w-3 h-3 text-emerald-650" />
                                  <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500 animate-pulse">Ajustes do Selo Secundário</span>
                                </div>
                                <div className="space-y-3">
                                  {/* Zoom */}
                                  <div className="space-y-1">
                                    <div className="flex items-center justify-between">
                                      <label className="text-[9px] font-bold text-zinc-400 uppercase">Zoom / Tamanho</label>
                                      <span className="text-[9px] font-bold text-emerald-650">{Math.round((data.secLogoScale ?? 1) * 100)}%</span>
                                    </div>
                                    <input 
                                      type="range" 
                                      min="0.2" 
                                      max="3" 
                                      step="0.01" 
                                      value={data.secLogoScale ?? 1} 
                                      onChange={(e) => setData(prev => ({ ...prev, secLogoScale: parseFloat(e.target.value) }))}
                                      className="w-full h-1 bg-zinc-200 rounded-full appearance-none cursor-pointer accent-emerald-600"
                                    />
                                  </div>
                                  {/* X Offset */}
                                  <div className="space-y-1">
                                    <div className="flex items-center justify-between">
                                      <label className="text-[9px] font-bold text-zinc-400 uppercase">Mover Horizontal (X)</label>
                                      <span className="text-[9px] font-bold text-zinc-500">{Math.round(data.secLogoX ?? 0)}px</span>
                                    </div>
                                    <input 
                                      type="range" 
                                      min="-200" 
                                      max="200" 
                                      step="1" 
                                      value={data.secLogoX ?? 0} 
                                      onChange={(e) => setData(prev => ({ ...prev, secLogoX: parseFloat(e.target.value) }))}
                                      className="w-full h-1 bg-zinc-200 rounded-full appearance-none cursor-pointer accent-zinc-500"
                                    />
                                  </div>
                                  {/* Y Offset */}
                                  <div className="space-y-1">
                                    <div className="flex items-center justify-between">
                                      <label className="text-[9px] font-bold text-zinc-400 uppercase">Mover Vertical (Y)</label>
                                      <span className="text-[9px] font-bold text-zinc-500">{Math.round(data.secLogoY ?? 0)}px</span>
                                    </div>
                                    <input 
                                      type="range" 
                                      min="-100" 
                                      max="100" 
                                      step="1" 
                                      value={data.secLogoY ?? 0} 
                                      onChange={(e) => setData(prev => ({ ...prev, secLogoY: parseFloat(e.target.value) }))}
                                      className="w-full h-1 bg-zinc-200 rounded-full appearance-none cursor-pointer accent-zinc-500"
                                    />
                                  </div>
                                </div>
                                <button 
                                  onClick={() => setData(prev => ({ ...prev, secLogoX: 0, secLogoY: 0, secLogoScale: 1 }))}
                                  className="w-full text-[9px] font-bold uppercase tracking-widest py-2 bg-white border border-zinc-200 text-zinc-400 hover:text-zinc-600 rounded-lg transition-all"
                                >
                                  Resetar Ajustes
                                </button>
                                <p className="text-[8px] text-zinc-400 text-center italic mt-1 font-sans">
                                  Você também pode clicar e arrastar o selo diretamente no banner!
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {activeLayout === 'coomarcas' && (
                        <div className="pt-6 border-t border-zinc-100 space-y-4">
                          <label className="text-xs font-black text-zinc-500 ml-1 uppercase tracking-wider block">Logotipos Adicionais (4 espaços abaixo do site)</label>
                          <div className="grid grid-cols-2 gap-3">
                            {[0, 1, 2, 3].map((idx) => {
                              const currentSubLogo = data.coomarcasSubLogos?.[idx] || null;
                              return (
                                <div key={idx} className="p-3 bg-zinc-50 border border-zinc-200 rounded-2xl flex flex-col gap-2">
                                  <span className="text-[9px] font-bold text-zinc-400 uppercase">Espaço {idx + 1}</span>
                                  <div className="flex items-center gap-2">
                                    <div className="w-11 h-11 bg-white border border-zinc-200 rounded-lg flex items-center justify-center relative overflow-hidden group flex-shrink-0 shadow-sm hover:border-zinc-300 transition-colors">
                                      {currentSubLogo ? (
                                        <img src={currentSubLogo} alt={`Selo ${idx + 1}`} className="w-full h-full object-contain p-1" />
                                      ) : (
                                        <Plus className="w-4 h-4 text-zinc-300" />
                                      )}
                                      <input 
                                        type="file" 
                                        accept="image/*" 
                                        onChange={(e) => handleCoomarcasSubLogoUpload(idx, e)} 
                                        className="absolute inset-0 opacity-0 cursor-pointer" 
                                      />
                                    </div>
                                    <div className="flex-1 min-w-0 space-y-1">
                                      <input 
                                        type="text" 
                                        placeholder="Cole link (URL)"
                                        value={currentSubLogo && currentSubLogo.startsWith('http') ? currentSubLogo : ''}
                                        onChange={(e) => {
                                          const val = e.target.value || null;
                                          const newSubLogos = [...(data.coomarcasSubLogos || [null, null, null, null])];
                                          newSubLogos[idx] = val;
                                          setCoomarcasGlobalSubLogos(newSubLogos);
                                          setData(prev => ({ ...prev, coomarcasSubLogos: newSubLogos }));
                                        }}
                                        className="w-full bg-white border border-zinc-200 rounded-lg px-2 py-1 text-[10px] font-medium min-w-0 outline-none focus:border-blue-500 transition-all shadow-sm"
                                      />
                                      {currentSubLogo && (
                                        <div className="flex flex-col gap-1">
                                          <button 
                                            onClick={() => {
                                              const newSubLogos = [...(data.coomarcasSubLogos || [null, null, null, null])];
                                              newSubLogos[idx] = null;
                                              setCoomarcasGlobalSubLogos(newSubLogos);
                                              setData(prev => ({ ...prev, coomarcasSubLogos: newSubLogos }));
                                            }}
                                            className="text-[8px] font-black text-red-500 hover:text-red-650 uppercase tracking-widest block text-left"
                                          >
                                            Remover Logo
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  {currentSubLogo && (
                                    <div className="mt-2 pt-2 border-t border-zinc-200/50 space-y-2">
                                      {/* Zoom */}
                                      <div className="space-y-0.5">
                                        <div className="flex items-center justify-between">
                                          <span className="text-[8px] font-bold text-zinc-400 uppercase">Tamanho</span>
                                          <span className="text-[8px] font-bold text-blue-600 font-mono">{Math.round((data.coomarcasSubLogosScale?.[idx] ?? 1) * 100)}%</span>
                                        </div>
                                        <input 
                                          type="range" 
                                          min="0.2" 
                                          max="3" 
                                          step="0.01" 
                                          value={data.coomarcasSubLogosScale?.[idx] ?? 1} 
                                          onChange={(e) => {
                                            const val = parseFloat(e.target.value);
                                            setData(prev => {
                                              const scales = [...(prev.coomarcasSubLogosScale || [1, 1, 1, 1])];
                                              scales[idx] = val;
                                              return { ...prev, coomarcasSubLogosScale: scales };
                                            });
                                          }}
                                          className="w-full h-1 bg-zinc-200 rounded-full appearance-none cursor-pointer accent-blue-600"
                                        />
                                      </div>
                                      {/* X Offset */}
                                      <div className="space-y-0.5">
                                        <div className="flex items-center justify-between">
                                          <span className="text-[8px] font-bold text-zinc-400 uppercase">Mover X</span>
                                          <span className="text-[8px] font-bold text-zinc-500 font-mono">{Math.round(data.coomarcasSubLogosX?.[idx] ?? 0)}px</span>
                                        </div>
                                        <input 
                                          type="range" 
                                          min="-150" 
                                          max="150" 
                                          step="1" 
                                          value={data.coomarcasSubLogosX?.[idx] ?? 0} 
                                          onChange={(e) => {
                                            const val = parseFloat(e.target.value);
                                            setData(prev => {
                                              const xs = [...(prev.coomarcasSubLogosX || [0, 0, 0, 0])];
                                              xs[idx] = val;
                                              return { ...prev, coomarcasSubLogosX: xs };
                                            });
                                          }}
                                          className="w-full h-1 bg-zinc-200 rounded-full appearance-none cursor-pointer accent-zinc-500"
                                        />
                                      </div>
                                      {/* Y Offset */}
                                      <div className="space-y-0.5">
                                        <div className="flex items-center justify-between">
                                          <span className="text-[8px] font-bold text-zinc-400 uppercase">Mover Y</span>
                                          <span className="text-[8px] font-bold text-zinc-500 font-mono">{Math.round(data.coomarcasSubLogosY?.[idx] ?? 0)}px</span>
                                        </div>
                                        <input 
                                          type="range" 
                                          min="-100" 
                                          max="100" 
                                          step="1" 
                                          value={data.coomarcasSubLogosY?.[idx] ?? 0} 
                                          onChange={(e) => {
                                            const val = parseFloat(e.target.value);
                                            setData(prev => {
                                              const ys = [...(prev.coomarcasSubLogosY || [0, 0, 0, 0])];
                                              ys[idx] = val;
                                              return { ...prev, coomarcasSubLogosY: ys };
                                            });
                                          }}
                                          className="w-full h-1 bg-zinc-200 rounded-full appearance-none cursor-pointer accent-zinc-500"
                                        />
                                      </div>
                                      {/* Individual Reset */}
                                      <button 
                                        onClick={() => setData(prev => {
                                          const xs = [...(prev.coomarcasSubLogosX || [0, 0, 0, 0])];
                                          const ys = [...(prev.coomarcasSubLogosY || [0, 0, 0, 0])];
                                          const scales = [...(prev.coomarcasSubLogosScale || [1, 1, 1, 1])];
                                          xs[idx] = 0;
                                          ys[idx] = 0;
                                          scales[idx] = 1;
                                          return { ...prev, coomarcasSubLogosX: xs, coomarcasSubLogosY: ys, coomarcasSubLogosScale: scales };
                                        })}
                                        className="w-full py-1 text-[8px] font-bold uppercase tracking-wider text-zinc-400 hover:text-zinc-650 bg-white border border-zinc-200 rounded-md shadow-sm transition-all"
                                      >
                                        Limpar Ajustes
                                      </button>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {data.photo && (
                      <div className="space-y-4 p-5 bg-zinc-50 rounded-3xl border border-zinc-100 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                          <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Ajustes da Imagem</span>
                        </div>
                        
                        <div className="space-y-4">
                          {/* Zoom */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <label className="text-[10px] font-bold text-zinc-400 uppercase">Zoom</label>
                              <span className="text-[10px] font-bold text-blue-600">{Math.round(data.photoScale * 100)}%</span>
                            </div>
                            <input 
                              type="range" 
                              min="0.1" 
                              max="4" 
                              step="0.01" 
                              value={data.photoScale} 
                              onChange={(e) => setData(prev => ({ ...prev, photoScale: parseFloat(e.target.value) }))}
                              className="w-full h-1 bg-zinc-200 rounded-full appearance-none cursor-pointer accent-blue-600"
                            />
                          </div>

                          {/* Horizontal */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <label className="text-[10px] font-bold text-zinc-400 uppercase">Horizontal (X)</label>
                              <span className="text-[10px] font-bold text-zinc-500">{Math.round(data.photoX)}px</span>
                            </div>
                            <input 
                              type="range" 
                              min="-300" 
                              max="300" 
                              step="1" 
                              value={data.photoX} 
                              onChange={(e) => setData(prev => ({ ...prev, photoX: parseFloat(e.target.value) }))}
                              className="w-full h-1 bg-zinc-200 rounded-full appearance-none cursor-pointer accent-zinc-500"
                            />
                          </div>

                          {/* Vertical */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <label className="text-[10px] font-bold text-zinc-400 uppercase">Vertical (Y)</label>
                              <span className="text-[10px] font-bold text-zinc-500">{Math.round(data.photoY)}px</span>
                            </div>
                            <input 
                              type="range" 
                              min="-300" 
                              max="300" 
                              step="1" 
                              value={data.photoY} 
                              onChange={(e) => setData(prev => ({ ...prev, photoY: parseFloat(e.target.value) }))}
                              className="w-full h-1 bg-zinc-200 rounded-full appearance-none cursor-pointer accent-zinc-500"
                            />
                          </div>
                        </div>

                        <div className="pt-2">
                          <button 
                            onClick={() => setData(prev => ({ ...prev, photoX: 0, photoY: 0, photoScale: 1 }))}
                            className="w-full text-[10px] font-black uppercase tracking-widest py-3 bg-white border border-zinc-200 text-zinc-500 rounded-xl hover:bg-zinc-100 hover:text-zinc-700 transition-all shadow-sm"
                          >
                            Resetar Posição
                          </button>
                        </div>
                        
                        <p className="text-[9px] text-zinc-400 text-center italic mt-2">
                          Você também pode clicar e arrastar a foto no banner
                        </p>
                      </div>
                    )}
                  </div>
                </section>
              </div>
            </div>
          </div>

          {/* Right Side: Preview Canvas Area */}
          <div className="flex-1 bg-zinc-100 rounded-2xl relative border border-zinc-200 shadow-inner p-6 md:p-12 flex flex-col items-center justify-center min-h-[500px]">
            {/* Subtle Grid Background */}
            <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 0)', backgroundSize: '30px 30px' }}></div>
            
            <div className="w-full flex flex-col items-center justify-center relative z-10">
              <span className="absolute -top-10 left-0 text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]">Visualização Direta (WYSIWYG)</span>
              
              <div 
                className="bg-white rounded-sm shadow-2xl transition-all duration-300 transform border border-zinc-100 overflow-hidden"
              >
                <SignatureCanvas 
                  data={data} 
                  setData={setData} 
                  activeLayout={activeLayout} 
                  brandLogos={brandLogos} 
                  secondaryLogos={secondaryLogos} 
                />
              </div>

              <div className="mt-8 flex items-center gap-2 bg-white/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/50 shadow-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">
                  Layout: {activeLayout.toUpperCase()} • Exportação 2x HD
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LayoutButton({ active, onClick, label }: { active: boolean, onClick: () => void, label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-6 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
        active 
          ? "bg-blue-600 text-white shadow-md shadow-blue-100" 
          : "text-slate-600 hover:bg-slate-50"
      )}
    >
      {label}
    </button>
  );
}

// --- New Canvas Rendering System ---

const getThemeStyles = (theme: LayoutType) => {
  switch (theme) {
    case 'pets': return { primary: '#4e1f95', gradient1: '#4e1f95', gradient2: '#6d28d9', accent: '#f5f3ff', badgeText: '#4e1f95', brand: 'PETS', group: 'COOMARCAS' };
    case 'rxanalises': return { primary: '#18181b', gradient1: '#18181b', gradient2: '#3f3f46', accent: '#f4f4f5', badgeText: '#18181b', brand: 'RX ANÁLISES', group: 'COOMARCAS' };
    case 'coomarcas': return { primary: '#000000', gradient1: '#000000', gradient2: '#27272a', accent: '#f4f4f5', badgeText: '#000000', brand: 'COOMARCAS', group: 'CONSELHO' };
    case 'mercaddo': return { primary: '#e11d48', gradient1: '#e11d48', gradient2: '#fb7185', accent: '#fff1f2', badgeText: '#e11d48', brand: 'MERCADDO', group: 'COOMARCAS' };
    case 'integree': return { primary: '#16a34a', gradient1: '#16a34a', gradient2: '#4ade80', accent: '#f0fdf4', badgeText: '#16a34a', brand: 'INTEGREE', group: 'COOMARCAS' };
    case 'farmacon':
    default: return { primary: '#4e84e7', gradient1: '#4e84e7', gradient2: '#6396f1', accent: '#e0ebfc', badgeText: '#4e84e7', brand: 'FARMACON', group: 'COOMARCAS' };
  }
};

const drawSignatureToCanvas = (
  ctx: CanvasRenderingContext2D, 
  data: SignatureData, 
  theme: LayoutType,
  profileImage: HTMLImageElement | null,
  brandLogoImage: HTMLImageElement | null = null,
  secondaryLogoImage: HTMLImageElement | null = null,
  coomarcasSubLogoImages: (HTMLImageElement | null)[] = []
) => {
  const styles = getThemeStyles(theme);
  const w = 900;
  const h = 252;

  // Clear & Background with right sidebar Custom Solid Color / Gradient
  const bgType = data.rightBgType || 'solid';
  if (bgType === 'gradient') {
    const rGradient = ctx.createLinearGradient(420, 0, w, h);
    rGradient.addColorStop(0, data.rightBgGradient1 || '#ffffff');
    rGradient.addColorStop(1, data.rightBgGradient2 || '#f4f4f5');
    ctx.fillStyle = rGradient;
  } else {
    ctx.fillStyle = data.rightBgColor || '#ffffff';
  }
  ctx.fillRect(0, 0, w, h);

  // Left Gradient Panel
  const gradient = ctx.createLinearGradient(0, 0, 420, h);
  gradient.addColorStop(0, styles.gradient1);
  gradient.addColorStop(1, styles.gradient2);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 420, h);

  // Left Content
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.font = '500 14px Arial';
  ctx.fillText(data.location || '', 30, 44);

  // Name with dynamic font size
  ctx.fillStyle = '#ffffff';
  let fontSize = 32;
  ctx.font = `bold ${fontSize}px Arial`;
  
  // Limite de largura para garantir um distanciamento (gap) constante da foto
  const maxWidth = 270; 
  let textWidth = ctx.measureText(data.name).width;
  
  while (textWidth > maxWidth && fontSize > 16) {
    fontSize -= 0.5;
    ctx.font = `bold ${fontSize}px Arial`;
    textWidth = ctx.measureText(data.name).width;
  }
  
  // Subindo a posição vertical (ajuste fino: 110 + 3 = 113)
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(data.name, 30, 113);

  // Role Badge - Ajuste fino de altura (125 + 3 = 128)
  const roleText = data.role.toUpperCase();
  ctx.font = 'bold 14px Arial';
  const roleWidth = ctx.measureText(roleText).width;
  
  ctx.fillStyle = styles.accent;
  const badgeX = 30;
  const badgeW = roleWidth + 40;
  const badgeH = 34;
  const badgeY = 128; 
  
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 17);
  } else {
    ctx.rect(badgeX, badgeY, badgeW, badgeH);
  }
  ctx.fill();
  
  ctx.fillStyle = styles.badgeText;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(roleText, badgeX + badgeW/2, badgeY + badgeH/2 + 1);
  
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';

  // Social Icons (Circles + Simplified Paths)
  const socialIcons = [
    { type: 'instagram', visible: data.socialVisibility?.instagram ?? true },
    { type: 'facebook', visible: data.socialVisibility?.facebook ?? true },
    { type: 'linkedin', visible: data.socialVisibility?.linkedin ?? true },
    { type: 'youtube', visible: data.socialVisibility?.youtube ?? true }
  ].filter(s => s.visible);

  socialIcons.forEach((social, idx) => {
    const cx = 30 + (idx * 44) + 16;
    const cy = 216;
    
    // Draw white circle
    ctx.beginPath();
    ctx.arc(cx, cy, 16, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    ctx.save();
    ctx.translate(cx, cy);
    ctx.fillStyle = styles.primary;

    if (social.type === 'instagram') {
      // Instagram icon (simplified)
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = styles.primary;
      // Border
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(-7, -7, 14, 14, 4);
      else ctx.rect(-7, -7, 14, 14);
      ctx.stroke();
      // Center circle
      ctx.beginPath();
      ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
      ctx.stroke();
      // Dot
      ctx.beginPath();
      ctx.arc(4, -4, 0.8, 0, Math.PI * 2);
      ctx.fill();
    } else if (social.type === 'facebook') {
      // Facebook 'f'
      ctx.font = '900 18px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('f', 1, 1);
    } else if (social.type === 'linkedin') {
      // LinkedIn 'in'
      ctx.font = 'bold 11px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('in', 0, 0);
    } else if (social.type === 'youtube') {
      // YouTube play button
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(-8, -6, 16, 12, 3);
      else ctx.rect(-8, -6, 16, 12);
      ctx.fill();
      // Triangle
      ctx.beginPath();
      ctx.moveTo(-2, -3);
      ctx.lineTo(3, 0);
      ctx.lineTo(-2, 3);
      ctx.closePath();
      ctx.fillStyle = '#ffffff';
      ctx.fill();
    }
    ctx.restore();
  });

  // Right Panel - Rounded edges
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.roundRect ? ctx.roundRect(360, 0, 540, h, [16, 0, 0, 16]) : ctx.rect(360, 0, 540, h);
  ctx.fill();

  // Logos (Top Right)
  if (brandLogoImage) {
    // Render uploaded logo
    const logoMaxW = 120;
    const logoMaxH = 40;
    const logoRatio = brandLogoImage.width / brandLogoImage.height;
    let logoW = logoMaxW;
    let logoH = logoW / logoRatio;
    
    if (logoH > logoMaxH) {
      logoH = logoMaxH;
      logoW = logoH * logoRatio;
    }
    
    const lScale = data.logoScale ?? 1;
    const lX = data.logoX ?? 0;
    const lY = data.logoY ?? 0;
    
    const finalW = logoW * lScale;
    const finalH = logoH * lScale;
    
    ctx.drawImage(
      brandLogoImage, 
      630 + lX - (finalW - logoW) / 2, 
      32 - finalH / 2 + lY, 
      finalW, 
      finalH
    );
  }

  // Plus Icon Logo OR Secondary Image
  if (secondaryLogoImage) {
    const secMaxW = 100;
    const secMaxH = 36;
    const secRatio = secondaryLogoImage.width / secondaryLogoImage.height;
    let secW = secMaxW;
    let secH = secW / secRatio;
    
    if (secH > secMaxH) {
      secH = secMaxH;
      secW = secH * secRatio;
    }
    
    const sScale = data.secLogoScale ?? 1;
    const sX = data.secLogoX ?? 0;
    const sY = data.secLogoY ?? 0;
    
    const finalSecW = secW * sScale;
    const finalSecH = secH * sScale;
    
    ctx.drawImage(
      secondaryLogoImage, 
      758 + sX - (finalSecW - secW) / 2, 
      32 - finalSecH / 2 + sY, 
      finalSecW, 
      finalSecH
    );
  }

  // Contact Info with actual icons
  const drawIconRow = (y: number, text: string, type: 'phone' | 'mail' | 'globe') => {
    const iconCx = 514;
    const iconCy = y - 8;
    
    const activeBg = data.contactIconBgColor || styles.accent;
    const activeFg = data.contactIconColor || '#ffffff';

    // Circle
    ctx.beginPath();
    ctx.arc(iconCx, iconCy, 16, 0, Math.PI * 2);
    ctx.fillStyle = activeBg;
    ctx.fill();
    
    // Icon (White / Custom)
    ctx.save();
    ctx.translate(iconCx, iconCy);
    ctx.strokeStyle = activeFg;
    ctx.fillStyle = activeFg;
    ctx.lineWidth = 1.2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (type === 'phone') {
      // WhatsApp icon - High fidelity mathematical reconstruction
      ctx.fillStyle = activeFg;
      
      // Main Bubble Circle
      ctx.beginPath();
      ctx.arc(0, -0.5, 8.5, 0, Math.PI * 2);
      ctx.fill();
      
      // Correct official tail angle (~230 degrees)
      ctx.beginPath();
      ctx.moveTo(-4.5, 5.5);
      ctx.lineTo(-10.5, 9.5);
      ctx.lineTo(-7.5, 3.5);
      ctx.fill();

      // Handset (Cutout)
      ctx.save();
      ctx.strokeStyle = activeBg;
      ctx.fillStyle = activeBg;
      ctx.lineWidth = 1.2;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';

      // Drawing a solid handset shape instead of simple strokes
      ctx.translate(0, -0.5);
      ctx.rotate(-Math.PI / 8); // Slight rotation for correct handset orientation
      
      ctx.beginPath();
      // Handset body path
      ctx.moveTo(-4, -4);
      ctx.bezierCurveTo(-6, -2, -2, 4, 3, 4);
      ctx.lineTo(4.5, 2.5);
      ctx.bezierCurveTo(3, 1, 1.5, 1, 0, 1);
      ctx.bezierCurveTo(-1.5, 0, -1.5, -2, -1, -3);
      ctx.lineTo(-2.5, -5);
      ctx.closePath();
      ctx.fill();
      
      ctx.restore();
    } else if (type === 'mail') {
      // Envelope icon
      ctx.strokeRect(-7, -5, 14, 10);
      ctx.beginPath();
      ctx.moveTo(-7, -5);
      ctx.lineTo(0, 1);
      ctx.lineTo(7, -5);
      ctx.stroke();
    } else if (type === 'globe') {
      // Globe icon
      ctx.beginPath();
      ctx.arc(0, 0, 7, 0, Math.PI * 2);
      ctx.stroke();
      // Horizontal line
      ctx.beginPath();
      ctx.moveTo(-7, 0);
      ctx.lineTo(7, 0);
      ctx.stroke();
      // Vertical ellipse
      ctx.beginPath();
      ctx.ellipse(0, 0, 3, 7, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
    
    ctx.fillStyle = '#173762';
    ctx.font = '500 18px Arial';
    ctx.fillText(text, 544, y);
  };

  drawIconRow(90, data.phone, 'phone');
  drawIconRow(134, data.email, 'mail');
  drawIconRow(178, data.website, 'globe');

  // Draw Coomarcas 4 sub-logos below website
  if (theme === 'coomarcas') {
    const startX = 514;
    const startY = 205;
    const boxW = 64;
    const boxH = 28;
    const gap = 16;
    const subLogos = coomarcasSubLogoImages || [];

    const subX = data.coomarcasSubLogosX || [0, 0, 0, 0];
    const subY = data.coomarcasSubLogosY || [0, 0, 0, 0];
    const subScale = data.coomarcasSubLogosScale || [1, 1, 1, 1];

    for (let i = 0; i < 4; i++) {
      const img = subLogos[i];
      if (img) {
        const slotX = startX + i * (boxW + gap);
        const imgRatio = img.width / img.height;
        let drawW = boxW;
        let drawH = drawW / imgRatio;
        if (drawH > boxH) {
          drawH = boxH;
          drawW = drawH * imgRatio;
        }

        const scaleValue = subScale[i] ?? 1;
        const finalW = drawW * scaleValue;
        const finalH = drawH * scaleValue;

        const offsetW = (boxW - drawW) / 2;
        const offsetH = (boxH - drawH) / 2;

        const dx = subX[i] ?? 0;
        const dy = subY[i] ?? 0;

        ctx.drawImage(
          img, 
          slotX + offsetW + dx - (finalW - drawW) / 2, 
          startY + offsetH + dy - (finalH - drawH) / 2, 
          finalW, 
          finalH
        );
      }
    }
  }

  // Photo
  const photoSize = 150;
  const photoX = 330;
  const photoY = 54;

  // Background for photo (the rounded square outline/border)
  ctx.fillStyle = data.photoBorderColor || '#ffffff';
  ctx.beginPath();
  ctx.roundRect ? ctx.roundRect(photoX - 4, photoY - 4, photoSize + 8, photoSize + 8, 12) : ctx.rect(photoX, photoY, photoSize, photoSize);
  ctx.fill();

  // Clip the photo area
  ctx.save();
  ctx.beginPath();
  ctx.roundRect ? ctx.roundRect(photoX, photoY, photoSize, photoSize, 12) : ctx.rect(photoX, photoY, photoSize, photoSize);
  ctx.clip();

  // Always fill the background first so transparent images have a nice backdrop
  ctx.fillStyle = data.photoBgColor || '#f4f4f5';
  ctx.fillRect(photoX, photoY, photoSize, photoSize);

  if (profileImage) {
    const imgRatio = profileImage.width / profileImage.height;
    let drawW, drawH;
    
    if (imgRatio >= 1) {
      // Paisagem ou Quadrada: Escala baseada na altura
      drawH = photoSize * data.photoScale;
      drawW = drawH * imgRatio;
    } else {
      // Retrato: Escala baseada na largura
      drawW = photoSize * data.photoScale;
      drawH = drawW / imgRatio;
    }

    ctx.drawImage(
      profileImage, 
      photoX + data.photoX - (drawW - photoSize)/2, 
      photoY + data.photoY - (drawH - photoSize)/2, 
      drawW, 
      drawH
    );
  }
  ctx.restore();
};

const SignatureCanvas = ({ data, setData, activeLayout, brandLogos, secondaryLogos }: { 
  data: SignatureData, 
  setData: React.Dispatch<React.SetStateAction<SignatureData>>,
  activeLayout: LayoutType,
  brandLogos: Record<LayoutType, string | null>,
  secondaryLogos: Record<LayoutType, string | null>
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const logoRef = useRef<HTMLImageElement | null>(null);
  const secondaryLogoRef = useRef<HTMLImageElement | null>(null);
  const coomarcasSubLogoRefs = useRef<(HTMLImageElement | null)[]>([]);

  React.useEffect(() => {
    const loadImage = (src: string | null): Promise<HTMLImageElement | null> => {
      return new Promise((resolve) => {
        if (!src) return resolve(null);
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = src;
      });
    };

    const renderAll = async () => {
      const layout = activeLayout;
      const subLogosSrc = data.coomarcasSubLogos || [null, null, null, null];
      const [profImg, brandImg, secBrandImg, subImg1, subImg2, subImg3, subImg4] = await Promise.all([
        loadImage(data.photo),
        loadImage(data.brandLogo || brandLogos[layout]),
        loadImage(data.secondaryLogo || secondaryLogos[layout]),
        loadImage(subLogosSrc[0]),
        loadImage(subLogosSrc[1]),
        loadImage(subLogosSrc[2]),
        loadImage(subLogosSrc[3])
      ]);
      imageRef.current = profImg;
      logoRef.current = brandImg;
      secondaryLogoRef.current = secBrandImg;
      coomarcasSubLogoRefs.current = [subImg1, subImg2, subImg3, subImg4];
      render();
    };

    renderAll();
  }, [data.photo, data.brandLogo, data.secondaryLogo, data.coomarcasSubLogos, brandLogos, secondaryLogos, activeLayout]);

  const render = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Suporte para Retina
    const dpr = window.devicePixelRatio || 1;
    canvas.width = 900 * dpr;
    canvas.height = 252 * dpr;
    ctx.scale(dpr, dpr);
    
    drawSignatureToCanvas(
      ctx, 
      data, 
      activeLayout, 
      imageRef.current, 
      logoRef.current, 
      secondaryLogoRef.current,
      coomarcasSubLogoRefs.current
    );
  };

  React.useEffect(render, [data, activeLayout]);

  // Função auxiliar para testar qual imagem está sendo clicada ou hovered
  const getDragTarget = (clientX: number, clientY: number): string | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = 900 / rect.width;
    const scaleY = 252 / rect.height;
    const clickX = (clientX - rect.left) * scaleX;
    const clickY = (clientY - rect.top) * scaleY;

    // Foto de Perfil: 330, 54, 150x150
    if (clickX >= 310 && clickX <= 495 && clickY >= 40 && clickY <= 215) {
      return 'photo';
    } 

    // Logo Principal: centralizado em X estimado em 690 + logoX, Y em 32 + logoY
    if (data.brandLogo) {
      const brandCenterX = 690 + (data.logoX ?? 0);
      const brandCenterY = 32 + (data.logoY ?? 0);
      const bScale = data.logoScale ?? 1;
      const bW = 120 * bScale;
      const bH = 40 * bScale;
      if (
        clickX >= brandCenterX - bW / 2 - 15 && clickX <= brandCenterX + bW / 2 + 15 &&
        clickY >= brandCenterY - bH / 2 - 15 && clickY <= brandCenterY + bH / 2 + 15
      ) {
        return 'brandLogo';
      }
    }

    // Logo Secundário: centralizado em X estimado em 808 + secLogoX, Y em 32 + secLogoY
    if (data.secondaryLogo) {
      const secCenterX = 808 + (data.secLogoX ?? 0);
      const secCenterY = 32 + (data.secLogoY ?? 0);
      const sScale = data.secLogoScale ?? 1;
      const sW = 100 * sScale;
      const sH = 36 * sScale;
      if (
        clickX >= secCenterX - sW / 2 - 15 && clickX <= secCenterX + sW / 2 + 15 &&
        clickY >= secCenterY - sH / 2 - 15 && clickY <= secCenterY + sH / 2 + 15
      ) {
        return 'secondaryLogo';
      }
    }

    // Selos Coomarcas:
    if (activeLayout === 'coomarcas') {
      const startX = 514;
      const startY = 205;
      const boxW = 64;
      const boxH = 28;
      const gap = 16;
      const subX = data.coomarcasSubLogosX || [0, 0, 0, 0];
      const subY = data.coomarcasSubLogosY || [0, 0, 0, 0];
      const subScale = data.coomarcasSubLogosScale || [1, 1, 1, 1];

      for (let i = 0; i < 4; i++) {
        if (data.coomarcasSubLogos?.[i]) {
          const slotX = startX + i * (boxW + gap);
          const centerX = slotX + boxW / 2 + (subX[i] ?? 0);
          const centerY = startY + boxH / 2 + (subY[i] ?? 0);
          const currentScale = subScale[i] ?? 1;
          const w = boxW * currentScale;
          const h = boxH * currentScale;

          if (
            clickX >= centerX - w / 2 - 10 && clickX <= centerX + w / 2 + 10 &&
            clickY >= centerY - h / 2 - 10 && clickY <= centerY + h / 2 + 10
          ) {
            return `subLogo${i}`;
          }
        }
      }
    }

    return null;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const target = getDragTarget(e.clientX, e.clientY);
    if (target) {
      canvas.style.cursor = 'grab';
    } else {
      canvas.style.cursor = 'default';
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const target = getDragTarget(e.clientX, e.clientY);
    if (!target) return; // Só arrasta se clicar em um elemento interativo

    const canvas = canvasRef.current;
    if (canvas) canvas.style.cursor = 'grabbing';

    const startX = e.clientX;
    const startY = e.clientY;
    
    const initialPhotoX = data.photoX;
    const initialPhotoY = data.photoY;
    const initialLogoX = data.logoX ?? 0;
    const initialLogoY = data.logoY ?? 0;
    const initialSecLogoX = data.secLogoX ?? 0;
    const initialSecLogoY = data.secLogoY ?? 0;
    const initialSubX = [...(data.coomarcasSubLogosX || [0, 0, 0, 0])];
    const initialSubY = [...(data.coomarcasSubLogosY || [0, 0, 0, 0])];

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;

      if (target === 'photo') {
        setData(prev => ({
          ...prev,
          photoX: initialPhotoX + deltaX,
          photoY: initialPhotoY + deltaY
        }));
      } else if (target === 'brandLogo') {
        setData(prev => ({
          ...prev,
          logoX: initialLogoX + deltaX,
          logoY: initialLogoY + deltaY
        }));
      } else if (target === 'secondaryLogo') {
        setData(prev => ({
          ...prev,
          secLogoX: initialSecLogoX + deltaX,
          secLogoY: initialSecLogoY + deltaY
        }));
      } else if (target.startsWith('subLogo')) {
        const index = parseInt(target.replace('subLogo', ''), 10);
        const nextX = [...initialSubX];
        const nextY = [...initialSubY];
        nextX[index] = initialSubX[index] + deltaX;
        nextY[index] = initialSubY[index] + deltaY;
        setData(prev => ({
          ...prev,
          coomarcasSubLogosX: nextX,
          coomarcasSubLogosY: nextY
        }));
      }
    };

    const onMouseUp = () => {
      if (canvas) {
        const currentTarget = getDragTarget(startX, startY);
        canvas.style.cursor = currentTarget ? 'grab' : 'default';
      }
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  return (
    <div className="relative">
      <canvas 
        id="signature-canvas"
        ref={canvasRef} 
        width={900} 
        height={252} 
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        className="block"
      />
    </div>
  );
};

const SocialIcon = ({ icon, themeColor }: { icon: React.ReactNode, themeColor: string }) => (
  <div 
    style={{ 
      width: '32px', 
      height: '32px', 
      borderRadius: '50%', 
      backgroundColor: '#ffffff', 
      display: 'inline-flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      color: themeColor,
      marginRight: '12px'
    }}
  >
    {icon}
  </div>
);

const IconRow = ({ icon, text, themeColor }: { icon: React.ReactNode, text: string, themeColor: string }) => (
  <div style={{ display: 'block', marginBottom: '12px', color: '#173762', height: '32px', whiteSpace: 'nowrap' }}>
    <div 
      style={{ 
        display: 'inline-block',
        verticalAlign: 'middle',
        width: '32px', 
        height: '32px', 
        borderRadius: '50%', 
        backgroundColor: themeColor, 
        color: '#ffffff',
        textAlign: 'center',
        marginRight: '14px'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', width: '100%' }}>
        {icon}
      </div>
    </div>
    <span style={{ 
      display: 'inline-block',
      verticalAlign: 'middle',
      fontSize: '18px', 
      fontWeight: 500, 
      letterSpacing: '-0.01em',
      lineHeight: '32px',
      height: '32px'
    }}>
      {text}
    </span>
  </div>
);



