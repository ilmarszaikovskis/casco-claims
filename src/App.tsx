/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  UserCheck, 
  Send, 
  Loader2, 
  ClipboardList,
  Search,
  Scale,
  MessageSquare,
  History,
  Link as LinkIcon,
  FileUp,
  X,
  Plus
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { ClaimData, EvaluationResult } from './types';
import { evaluateClaim } from './services/geminiService';

const INITIAL_DATA: ClaimData = {
  lietas_id: '',
  produkts: 'KASKO',
  polises_numurs: '',
  polises_redakcija: '',
  polise_no: '',
  polise_lidz: '',
  seguma_veids: 'Pilns KASKO',
  pasrisks: '',
  negadijuma_datums: '',
  pieteikuma_datums: '',
  negadijuma_vieta: '',
  klienta_pieteiktais_notikums: '',
  konstatetie_fakti: '',
  iesniegtie_dokumenti: '',
  eksperta_info: '',
  pretrunas_riski: '',
  balcia_noteikumu_punkti: '',
  rules_urls: [],
  rules_files: [],
  historical_documents: [],
  ltab_metodika: '',
  ieksejas_vadlinijas: '',
  papildu_uzdevums: ''
};

const EXAMPLE_DATA: ClaimData = {
  lietas_id: 'KSK-2026-00125',
  produkts: 'KASKO',
  polises_numurs: 'LV-4588221',
  polises_redakcija: 'KASKO 2025. gada redakcija',
  polise_no: '2026-01-01',
  polise_lidz: '2026-12-31',
  seguma_veids: 'Pilns KASKO',
  pasrisks: '150 EUR',
  negadijuma_datums: '2026-02-10',
  pieteikuma_datums: '2026-02-15',
  negadijuma_vieta: 'Rīga',
  klienta_pieteiktais_notikums: 'Transportlīdzeklis tika bojāts stāvlaukumā, atgriežoties konstatēju bojātu priekšējo bamperi.',
  konstatetie_fakti: 'Bojāts priekšējais bamperis; nav trešās personas datu; policija netika izsaukta; pieteikums iesniegts pēc 5 dienām.',
  iesniegtie_dokumenti: 'Klienta iesniegums, fotogrāfijas, servisa tāme.',
  eksperta_info: 'Eksperts norāda, ka bojājuma raksturs var neatbilst vienkāršam stāvlaukuma kontaktam.',
  pretrunas_riski: 'Klienta apraksts iespējami neatbilst bojājumu ģeometrijai.',
  balcia_noteikumu_punkti: '4.1. Risks: Sadursme ar citu transportlīdzekli vai šķērsli.\n12.3. Izņēmums: Ja bojājumi radušies apstākļos, kas neatbilst pieteiktajam notikumam.',
  rules_urls: ['https://www.balcia.lv/lv/kasko-noteikumi'],
  rules_files: [],
  historical_documents: [],
  ltab_metodika: 'LTAB metodika par stāvlaukuma bojājumu raksturu un pēdu analīzi.',
  ieksejas_vadlinijas: 'Pievērst uzmanību pieteikšanas termiņam (3 darba dienas).',
  papildu_uzdevums: 'Izvērtē, vai pamatotāk ir pieprasīt papildu skaidrojumu, nevis uzreiz atteikt.'
};

export default function App() {
  const [formData, setFormData] = useState<ClaimData>(INITIAL_DATA);
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState('');

  const handleInputChange = (field: keyof ClaimData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addUrl = () => {
    if (urlInput && !formData.rules_urls.includes(urlInput)) {
      handleInputChange('rules_urls', [...formData.rules_urls, urlInput]);
      setUrlInput('');
    }
  };

  const removeUrl = (url: string) => {
    handleInputChange('rules_urls', formData.rules_urls.filter(u => u !== url));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const data = event.target?.result as string;
        handleInputChange('rules_files', [
          ...formData.rules_files,
          { name: file.name, data, mimeType: file.type }
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeFile = (name: string) => {
    handleInputChange('rules_files', formData.rules_files.filter(f => f.name !== name));
  };

  const handleHistoricalUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const data = event.target?.result as string;
        handleInputChange('historical_documents', [
          ...formData.historical_documents,
          { name: file.name, data, mimeType: file.type }
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeHistoricalFile = (name: string) => {
    handleInputChange('historical_documents', formData.historical_documents.filter(f => f.name !== name));
  };

  const handleEvaluate = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const evaluation = await evaluateClaim(formData);
      setResult(evaluation);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Notikusi kļūda izvērtēšanas laikā.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadExample = () => {
    setFormData(EXAMPLE_DATA);
    setResult(null);
    setError(null);
  };

  const getDecisionIcon = (decision: string) => {
    switch (decision) {
      case 'izmaksāt': return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'izmaksāt daļēji': return <CheckCircle2 className="w-5 h-5 text-yellow-500" />;
      case 'atteikt': return <XCircle className="w-5 h-5 text-red-500" />;
      case 'pieprasīt papildinformāciju': return <HelpCircle className="w-5 h-5 text-blue-500" />;
      case 'nodot manuālai izvērtēšanai': return <UserCheck className="w-5 h-5 text-purple-500" />;
      default: return null;
    }
  };

  const getConfidenceColor = (level: string) => {
    switch (level) {
      case 'augsts': return 'bg-green-100 text-green-800 border-green-200';
      case 'vidējs': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'zems': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A1A] font-sans selection:bg-orange-100">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center">
              <ShieldCheck className="text-white w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">
              Balcia <span className="text-orange-600">KASKO</span> AI
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={loadExample} className="hidden sm:flex gap-2">
              <History className="w-4 h-4" />
              Ielādēt piemēru
            </Button>
            <Badge variant="secondary" className="bg-orange-50 text-orange-700 border-orange-100">
              Beta v1.1
            </Badge>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Form */}
          <div className="lg:col-span-5 space-y-6">
            <Card className="border-none shadow-sm ring-1 ring-gray-200">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-orange-600" />
                  Lietas dati
                </CardTitle>
                <CardDescription>
                  Aizpildiet informāciju par apdrošināšanas gadījumu.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Tabs defaultValue="identification" className="w-full">
                  <TabsList className="grid grid-cols-3 w-full mb-4">
                    <TabsTrigger value="identification">ID</TabsTrigger>
                    <TabsTrigger value="accident">Notikums</TabsTrigger>
                    <TabsTrigger value="legal">Noteikumi</TabsTrigger>
                  </TabsList>

                  <TabsContent value="identification" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="lietas_id">Lietas ID</Label>
                        <Input 
                          id="lietas_id" 
                          placeholder="KSK-2026-..." 
                          value={formData.lietas_id}
                          onChange={(e) => handleInputChange('lietas_id', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="produkts">Produkts</Label>
                        <Input 
                          id="produkts" 
                          value={formData.produkts}
                          onChange={(e) => handleInputChange('produkts', e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="polises_numurs">Polises numurs</Label>
                        <Input 
                          id="polises_numurs" 
                          value={formData.polises_numurs}
                          onChange={(e) => handleInputChange('polises_numurs', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="seguma_veids">Seguma veids</Label>
                        <Select 
                          value={formData.seguma_veids} 
                          onValueChange={(v) => handleInputChange('seguma_veids', v)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Izvēlieties" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Pilns KASKO">Pilns KASKO</SelectItem>
                            <SelectItem value="Mini KASKO">Mini KASKO</SelectItem>
                            <SelectItem value="KASKO+">KASKO+</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="polise_no">Spēkā no</Label>
                        <Input 
                          id="polise_no" 
                          type="date"
                          value={formData.polise_no}
                          onChange={(e) => handleInputChange('polise_no', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="polise_lidz">Spēkā līdz</Label>
                        <Input 
                          id="polise_lidz" 
                          type="date"
                          value={formData.polise_lidz}
                          onChange={(e) => handleInputChange('polise_lidz', e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pasrisks">Pašrisks</Label>
                      <Input 
                        id="pasrisks" 
                        placeholder="Piem. 150 EUR vai 10%" 
                        value={formData.pasrisks}
                        onChange={(e) => handleInputChange('pasrisks', e.target.value)}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="accident" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="negadijuma_datums">Negadījuma datums</Label>
                        <Input 
                          id="negadijuma_datums" 
                          type="date"
                          value={formData.negadijuma_datums}
                          onChange={(e) => handleInputChange('negadijuma_datums', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="pieteikuma_datums">Pieteikuma datums</Label>
                        <Input 
                          id="pieteikuma_datums" 
                          type="date"
                          value={formData.pieteikuma_datums}
                          onChange={(e) => handleInputChange('pieteikuma_datums', e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="negadijuma_vieta">Vieta</Label>
                      <Input 
                        id="negadijuma_vieta" 
                        value={formData.negadijuma_vieta}
                        onChange={(e) => handleInputChange('negadijuma_vieta', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="klienta_pieteiktais_notikums">Klienta apraksts</Label>
                      <Textarea 
                        id="klienta_pieteiktais_notikums" 
                        placeholder="Kā klients apraksta notikušo..."
                        className="min-h-[100px]"
                        value={formData.klienta_pieteiktais_notikums}
                        onChange={(e) => handleInputChange('klienta_pieteiktais_notikums', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="konstatetie_fakti">Konstatētie fakti</Label>
                      <Textarea 
                        id="konstatetie_fakti" 
                        placeholder="Objektīvi konstatētie fakti..."
                        className="min-h-[100px]"
                        value={formData.konstatetie_fakti}
                        onChange={(e) => handleInputChange('konstatetie_fakti', e.target.value)}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="legal" className="space-y-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <LinkIcon className="w-4 h-4 text-orange-600" />
                          Noteikumu saites (URL)
                        </Label>
                        <div className="flex gap-2">
                          <Input 
                            placeholder="https://..." 
                            value={urlInput}
                            onChange={(e) => setUrlInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && addUrl()}
                          />
                          <Button variant="outline" size="icon" onClick={addUrl}>
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {formData.rules_urls.map((url, i) => (
                            <Badge key={i} variant="secondary" className="gap-1 pr-1">
                              <span className="max-w-[150px] truncate">{url}</span>
                              <Button variant="ghost" size="icon" className="h-4 w-4 p-0 hover:bg-transparent" onClick={() => removeUrl(url)}>
                                <X className="h-3 w-3" />
                              </Button>
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <FileUp className="w-4 h-4 text-orange-600" />
                          Noteikumu faili (PDF)
                        </Label>
                        <div className="flex items-center justify-center w-full">
                          <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-200 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                              <FileUp className="w-6 h-6 text-gray-400 mb-2" />
                              <p className="text-xs text-gray-500">Klikšķiniet vai velciet PDF failus</p>
                            </div>
                            <input type="file" className="hidden" accept=".pdf" multiple onChange={handleFileUpload} />
                          </label>
                        </div>
                        <div className="space-y-1 mt-2">
                          {formData.rules_files.map((file, i) => (
                            <div key={i} className="flex items-center justify-between p-2 bg-white border rounded-md text-xs">
                              <span className="truncate max-w-[200px]">{file.name}</span>
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeFile(file.name)}>
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <History className="w-4 h-4 text-orange-600" />
                          Vēsturiskie lēmumi / Atzinumi (Krātuve)
                        </Label>
                        <div className="flex items-center justify-center w-full">
                          <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-200 rounded-lg cursor-pointer bg-orange-50/20 hover:bg-orange-50/40 transition-colors">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                              <FileUp className="w-6 h-6 text-orange-400 mb-2" />
                              <p className="text-xs text-gray-500 text-center px-4">Ielādējiet esošos atteikumus un atzinumus zināšanu bāzei</p>
                            </div>
                            <input type="file" className="hidden" accept=".pdf" multiple onChange={handleHistoricalUpload} />
                          </label>
                        </div>
                        <div className="space-y-1 mt-2">
                          {formData.historical_documents.map((file, i) => (
                            <div key={i} className="flex items-center justify-between p-2 bg-white border rounded-md text-xs">
                              <span className="truncate max-w-[200px] font-medium text-orange-900">{file.name}</span>
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeHistoricalFile(file.name)}>
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-2">
                        <Label htmlFor="balcia_noteikumu_punkti">Noteikumu punkti (Teksts)</Label>
                        <Textarea 
                          id="balcia_noteikumu_punkti" 
                          placeholder="Ielīmējiet attiecināmos punktus..."
                          className="min-h-[100px] font-mono text-sm"
                          value={formData.balcia_noteikumu_punkti}
                          onChange={(e) => handleInputChange('balcia_noteikumu_punkti', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="ltab_metodika">LTAB metodika / Citi principi</Label>
                      <Textarea 
                        id="ltab_metodika" 
                        placeholder="Metodikas fragmenti..."
                        className="min-h-[80px]"
                        value={formData.ltab_metodika}
                        onChange={(e) => handleInputChange('ltab_metodika', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="papildu_uzdevums">Papildu uzdevums AI</Label>
                      <Input 
                        id="papildu_uzdevums" 
                        placeholder="Piem. 'Īpaši izvērtē termiņus'" 
                        value={formData.papildu_uzdevums}
                        onChange={(e) => handleInputChange('papildu_uzdevums', e.target.value)}
                      />
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
              <CardFooter className="pt-2">
                <Button 
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white gap-2 h-11"
                  onClick={handleEvaluate}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Analizē lietu...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Veikt izvērtēšanu
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-red-50 border border-red-100 rounded-lg flex items-start gap-3 text-red-800"
              >
                <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" />
                <p className="text-sm">{error}</p>
              </motion.div>
            )}
          </div>

          {/* Right Column: Results */}
          <div className="lg:col-span-7">
            <AnimatePresence mode="wait">
              {result ? (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  {/* Summary Card */}
                  <Card className="border-none shadow-sm ring-1 ring-gray-200 overflow-hidden">
                    <div className={`h-2 w-full ${
                      result.ieteicamais_lemuma_veids === 'atteikt' ? 'bg-red-500' : 
                      result.ieteicamais_lemuma_veids === 'izmaksāt' ? 'bg-green-500' : 'bg-orange-500'
                    }`} />
                    <CardHeader className="flex flex-row items-start justify-between space-y-0">
                      <div>
                        <CardTitle className="text-xl">Izvērtējuma rezultāts</CardTitle>
                        <CardDescription>Lietas ID: {formData.lietas_id || 'Nezināms'}</CardDescription>
                      </div>
                      <Badge className={`px-3 py-1 text-sm font-medium border ${getConfidenceColor(result.parliecibas_limenis)}`}>
                        Pārliecība: {result.parliecibas_limenis}
                      </Badge>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 space-y-1">
                          <Label className="text-xs uppercase tracking-wider text-gray-500">Ieteicamais lēmums</Label>
                          <div className="flex items-center gap-2 font-semibold text-lg capitalize">
                            {getDecisionIcon(result.ieteicamais_lemuma_veids)}
                            {result.ieteicamais_lemuma_veids}
                          </div>
                        </div>
                        <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 space-y-1">
                          <Label className="text-xs uppercase tracking-wider text-gray-500">Cilvēka pārbaude</Label>
                          <div className="flex items-center gap-2 font-semibold text-lg">
                            {result.nepieciesama_cilveka_parbaude === 'Jā' ? (
                              <AlertTriangle className="w-5 h-5 text-orange-500" />
                            ) : (
                              <CheckCircle2 className="w-5 h-5 text-green-500" />
                            )}
                            {result.nepieciesama_cilveka_parbaude}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h3 className="font-semibold flex items-center gap-2">
                          <FileText className="w-4 h-4 text-orange-600" />
                          Kopsavilkums
                        </h3>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          {result.lietas_kopsavilkums}
                        </p>
                      </div>

                      <Separator />

                      <Tabs defaultValue="analysis" className="w-full">
                        <TabsList className="grid grid-cols-3 w-full">
                          <TabsTrigger value="analysis">Analīze</TabsTrigger>
                          <TabsTrigger value="internal">Iekšējais atzinums</TabsTrigger>
                          <TabsTrigger value="client">Klienta vēstule</TabsTrigger>
                        </TabsList>

                        <TabsContent value="analysis" className="pt-4 space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                              <h4 className="text-sm font-bold uppercase tracking-tight text-gray-500">Konstatētie fakti</h4>
                              <ul className="space-y-2">
                                {result.konstatetie_fakti.map((fakt, i) => (
                                  <li key={i} className="text-sm flex items-start gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-1.5 shrink-0" />
                                    {fakt}
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div className="space-y-3">
                              <h4 className="text-sm font-bold uppercase tracking-tight text-gray-500">Pretrunas un riski</h4>
                              <ul className="space-y-2">
                                {result.konstatetas_pretrunas_vai_riski.map((risk, i) => (
                                  <li key={i} className="text-sm flex items-start gap-2 text-red-700">
                                    <AlertTriangle className="w-4 h-4 shrink-0" />
                                    {risk}
                                  </li>
                                ))}
                                {result.konstatetas_pretrunas_vai_riski.length === 0 && (
                                  <li className="text-sm text-gray-400 italic">Nav konstatētu pretrunu.</li>
                                )}
                              </ul>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <h4 className="text-sm font-bold uppercase tracking-tight text-gray-500">Piemērotie noteikumi</h4>
                            <div className="space-y-3">
                              {result.attiecinamie_noteikumu_punkti.map((p, i) => (
                                <div key={i} className="p-3 rounded-lg bg-orange-50/50 border border-orange-100">
                                  <div className="font-bold text-sm text-orange-900">{p.punkts}</div>
                                  <div className="text-sm text-orange-800/80 mt-1">{p.skaidrojums}</div>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <h4 className="text-sm font-bold uppercase tracking-tight text-gray-500">Izvērtējums un pamatojums</h4>
                            <div className="p-4 rounded-xl bg-white border border-gray-200 text-sm leading-relaxed">
                              {result.izvertejums}
                              <div className="mt-4 pt-4 border-t border-gray-100 font-medium italic">
                                {result.pamatojums}
                              </div>
                            </div>
                          </div>
                        </TabsContent>

                        <TabsContent value="internal" className="pt-4">
                          <Card className="bg-gray-900 text-gray-100 border-none">
                            <CardHeader className="pb-2">
                              <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-mono flex items-center gap-2">
                                  <Scale className="w-4 h-4" />
                                  INTERNAL_REPORT.md
                                </CardTitle>
                                <Button variant="ghost" size="sm" className="h-8 text-xs hover:bg-gray-800" onClick={() => navigator.clipboard.writeText(result.ieksejais_atzinuma_projekts)}>
                                  Kopēt
                                </Button>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <ScrollArea className="h-[400px] pr-4">
                                <pre className="text-xs font-mono whitespace-pre-wrap leading-relaxed opacity-90">
                                  {result.ieksejais_atzinuma_projekts}
                                </pre>
                              </ScrollArea>
                            </CardContent>
                          </Card>
                        </TabsContent>

                        <TabsContent value="client" className="pt-4">
                          <Card className="border-orange-200 bg-orange-50/30">
                            <CardHeader className="pb-2">
                              <div className="flex items-center justify-between">
                                <CardTitle className="text-sm flex items-center gap-2 text-orange-900">
                                  <MessageSquare className="w-4 h-4" />
                                  Vēstules projekts klientam
                                </CardTitle>
                                <Button variant="outline" size="sm" className="h-8 text-xs border-orange-200 text-orange-900 hover:bg-orange-100" onClick={() => navigator.clipboard.writeText(result.klientam_nosutama_lemuma_projekts)}>
                                  Kopēt
                                </Button>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <ScrollArea className="h-[400px] pr-4">
                                <div className="text-sm leading-relaxed text-gray-800 whitespace-pre-wrap font-serif italic">
                                  {result.klientam_nosutama_lemuma_projekts}
                                </div>
                              </ScrollArea>
                            </CardContent>
                          </Card>
                        </TabsContent>
                      </Tabs>
                    </CardContent>
                  </Card>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="h-full flex flex-col items-center justify-center text-center p-12 space-y-4 border-2 border-dashed border-gray-200 rounded-2xl bg-white/50"
                >
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
                    <Search className="w-8 h-8" />
                  </div>
                  <div className="max-w-xs space-y-2">
                    <h3 className="font-semibold text-lg">Gatavs analīzei</h3>
                    <p className="text-sm text-gray-500">
                      Ievadiet lietas datus kreisajā pusē un spiediet "Veikt izvērtēšanu", lai iegūtu AI analīzi.
                    </p>
                  </div>
                  <Button variant="link" onClick={loadExample} className="text-orange-600">
                    Sākt ar piemēru
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t bg-white py-8">
        <div className="container mx-auto px-4 text-center space-y-4">
          <p className="text-sm text-gray-500">
            © 2026 Balcia Insurance SE. AI asistents lēmumu atbalstam.
          </p>
          <div className="flex items-center justify-center gap-6">
            <a href="#" className="text-xs text-gray-400 hover:text-orange-600 transition-colors">Lietošanas noteikumi</a>
            <a href="#" className="text-xs text-gray-400 hover:text-orange-600 transition-colors">Privātuma politika</a>
            <a href="#" className="text-xs text-gray-400 hover:text-orange-600 transition-colors">Palīdzība</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
