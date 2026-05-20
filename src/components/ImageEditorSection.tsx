import React from 'react';
import { 
  Image as ImageIcon,
  Upload, 
  Check, 
  RefreshCw,
  Plus,
  AlertCircle
} from 'lucide-react';
import { cn } from '../lib/utils';
import { SignatureData, LayoutType } from '../App';

interface ImageEditorSectionProps {
  data: SignatureData;
  setData: React.Dispatch<React.SetStateAction<SignatureData>>;
  activeLayout: LayoutType;
  photoError: boolean;
  setPhotoError: (val: boolean) => void;
  logoError: boolean;
  setLogoError: (val: boolean) => void;
  secLogoError: boolean;
  setSecLogoError: (val: boolean) => void;
  setBrandLogos: React.Dispatch<React.SetStateAction<Record<LayoutType, string | null>>>;
  setSecondaryLogos: React.Dispatch<React.SetStateAction<Record<LayoutType, string | null>>>;
  setCoomarcasGlobalSubLogos: (val: (string | null)[]) => void;
  handlePhotoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleBrandLogoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSecondaryLogoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleCoomarcasSubLogoUpload: (idx: number, e: React.ChangeEvent<HTMLInputElement>) => void;
  convertCloudImageUrl: (url: string) => string;
  getLoadedImageUrl: (url: string | null) => string;
  currentStyles: { primary: string; secondary: string; accent: string };
}

export const ImageEditorSection: React.FC<ImageEditorSectionProps> = ({
  data,
  setData,
  activeLayout,
  photoError,
  setPhotoError,
  logoError,
  setLogoError,
  secLogoError,
  setSecLogoError,
  setBrandLogos,
  setSecondaryLogos,
  setCoomarcasGlobalSubLogos,
  handlePhotoUpload,
  handleBrandLogoUpload,
  handleSecondaryLogoUpload,
  handleCoomarcasSubLogoUpload,
  convertCloudImageUrl,
  getLoadedImageUrl,
  currentStyles,
}) => {
  const [highlightAdjustments, setHighlightAdjustments] = React.useState(false);
  const prevPhotoRef = React.useRef<string | null>(data.photo || null);

  React.useEffect(() => {
    if (data.photo && !prevPhotoRef.current) {
      setTimeout(() => {
        const element = document.getElementById('photo-adjustment-controls');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setHighlightAdjustments(true);
          setTimeout(() => {
            setHighlightAdjustments(false);
          }, 2000);
        }
      }, 150);
    }
    prevPhotoRef.current = data.photo || null;
  }, [data.photo]);

  return (
    <section className="space-y-6">
      <h2 className="text-xs font-black uppercase tracking-widest text-zinc-400 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-zinc-50 flex items-center justify-center">
          <ImageIcon className="w-4.5 h-4.5 text-zinc-500" />
        </div>
        Inserção e Ajuste de Imagens
      </h2>
      <div className="space-y-6">
        <div>
          <label className="text-xs font-bold text-zinc-500 ml-1 uppercase tracking-wider mb-2 block">Foto de Perfil</label>
          <div className="p-8 border-2 border-dashed border-zinc-200 rounded-3xl flex flex-col items-center justify-center bg-zinc-50 hover:bg-zinc-100 transition-colors cursor-pointer group relative">
            <div className="w-20 h-20 rounded-full bg-white border border-zinc-200 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform overflow-hidden shadow-sm relative">
              {data.photo ? (
                <img 
                  src={getLoadedImageUrl(data.photo)} 
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
            <input id="profile-photo-input" type="file" accept="image/*" onChange={handlePhotoUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
          </div>
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

          {data.photo && (
            <div 
              id="photo-adjustment-controls" 
              className={cn(
                "pt-4 border-t border-zinc-200/50 space-y-4 scroll-mt-12 transition-all duration-700",
                highlightAdjustments ? "ring-2 ring-blue-500/30 bg-blue-50/20 p-3 rounded-2xl" : ""
              )}
            >
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block ml-1">Ajuste de Tamanho e Posição da Foto</span>
              
              <div className="bg-zinc-50/50 border border-zinc-150 rounded-2xl p-4 space-y-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-zinc-500 ml-1 uppercase tracking-wider block">Tamanho Proporcional (Zoom)</label>
                    <span className="text-[10px] font-bold text-blue-650 font-mono bg-blue-50 px-2 py-0.5 rounded-full">{Math.round(data.photoScale * 100)}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0.1" 
                    max="4" 
                    step="0.01" 
                    value={data.photoScale} 
                    onChange={(e) => setData(prev => ({ ...prev, photoScale: parseFloat(e.target.value) }))}
                    className="w-full h-1.5 bg-zinc-200 rounded-full appearance-none cursor-pointer accent-blue-650 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 pt-1">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold text-zinc-500 ml-1 uppercase tracking-wider block">Posição X (Horizontal)</label>
                      <span className="text-[10px] font-bold text-zinc-650 font-mono bg-zinc-100 px-1.5 py-0.2 rounded">{Math.round(data.photoX)}px</span>
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

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold text-zinc-500 ml-1 uppercase tracking-wider block">Posição Y (Vertical)</label>
                      <span className="text-[10px] font-bold text-zinc-650 font-mono bg-zinc-100 px-1.5 py-0.2 rounded">{Math.round(data.photoY)}px</span>
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

                <div className="pt-3 flex items-center justify-between gap-4 border-t border-zinc-200/50">
                  <div className="flex items-center gap-1.5">
                    <button 
                      onClick={() => setData(prev => ({ ...prev, photoX: prev.photoX - 5 }))}
                      title="Mover 5px para esquerda"
                      className="w-8 h-8 rounded-lg bg-white border border-zinc-250 flex items-center justify-center text-xs font-bold text-zinc-650 hover:bg-zinc-50 hover:border-zinc-400 active:scale-95 transition-all shadow-sm"
                    >
                      ◀
                    </button>
                    <div className="flex flex-col gap-0.5">
                      <button 
                        onClick={() => setData(prev => ({ ...prev, photoY: prev.photoY - 5 }))}
                        title="Mover 5px para cima"
                        className="w-8 h-4 rounded-t-lg bg-white border border-zinc-250 flex items-center justify-center text-[8px] font-bold text-zinc-650 hover:bg-zinc-50 hover:border-zinc-400 active:scale-95 transition-all shadow-sm"
                      >
                        ▲
                      </button>
                      <button 
                        onClick={() => setData(prev => ({ ...prev, photoY: prev.photoY + 5 }))}
                        title="Mover 5px para baixo"
                        className="w-8 h-4 rounded-b-lg bg-white border-b border-x border-zinc-250 flex items-center justify-center text-[8px] font-bold text-zinc-650 hover:bg-zinc-50 hover:border-zinc-400 active:scale-95 transition-all shadow-sm"
                      >
                        ▼
                      </button>
                    </div>
                    <button 
                      onClick={() => setData(prev => ({ ...prev, photoX: prev.photoX + 5 }))}
                      title="Mover 5px para direita"
                      className="w-8 h-8 rounded-lg bg-white border border-zinc-250 flex items-center justify-center text-xs font-bold text-zinc-650 hover:bg-zinc-50 hover:border-zinc-400 active:scale-95 transition-all shadow-sm"
                    >
                      ▶
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button 
                      onClick={() => setData(prev => ({ ...prev, photoScale: Math.max(0.1, prev.photoScale - 0.05) }))}
                      title="Diminuir 5%"
                      className="w-8 h-8 rounded-lg bg-white border border-zinc-250 flex items-center justify-center text-lg font-bold text-zinc-650 hover:bg-zinc-50 hover:border-zinc-400 active:scale-95 transition-all shadow-sm"
                    >
                      -
                    </button>
                    <button 
                      onClick={() => setData(prev => ({ ...prev, photoScale: Math.min(4.0, prev.photoScale + 0.05) }))}
                      title="Aumentar 5%"
                      className="w-8 h-8 rounded-lg bg-white border border-zinc-250 flex items-center justify-center text-lg font-bold text-zinc-650 hover:bg-zinc-50 hover:border-zinc-400 active:scale-95 transition-all shadow-sm"
                    >
                      +
                    </button>
                  </div>

                  <button 
                    onClick={() => setData(prev => ({ ...prev, photoX: 0, photoY: 0, photoScale: 1 }))}
                    className="px-3 h-8 text-[9px] font-black uppercase tracking-widest bg-white border border-zinc-250 text-zinc-500 hover:text-red-500 hover:border-red-200 rounded-lg transition-all shadow-sm flex items-center justify-center"
                  >
                    Limpar
                  </button>
                </div>
                
                <p className="text-[9px] text-zinc-400 text-center italic leading-none pt-1">
                  Dica: Você também pode clicar e arrastar a foto diretamente no banner!
                </p>
              </div>
            </div>
          )}
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
                      <RefreshCw className="w-3 h-3 text-emerald-600" />
                      <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500 animate-pulse">Ajustes do Selo Secundário</span>
                    </div>
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="text-[9px] font-bold text-zinc-400 uppercase">Zoom / Tamanho</label>
                          <span className="text-[9px] font-bold text-emerald-600">{Math.round((data.secLogoScale ?? 1) * 100)}%</span>
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
                                className="text-[8px] font-black text-red-500 hover:text-red-655 uppercase tracking-widest block text-left"
                              >
                                Remover Logo
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      {currentSubLogo && (
                        <div className="mt-2 pt-2 border-t border-zinc-200/50 space-y-2">
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
      </div>
    </section>
  );
};
