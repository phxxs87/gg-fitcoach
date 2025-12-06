"use client";

import { useState, useEffect } from "react";
import { 
  Dumbbell, 
  Target, 
  Award,
  Clock,
  Users,
  TrendingUp,
  CheckCircle,
  Star,
  Menu,
  X,
  Home,
  Calendar,
  BarChart3,
  User,
  Settings,
  ChevronRight,
  Play,
  Pause,
  Plus,
  Heart,
  MessageCircle,
  Mail,
  Send,
  Upload,
  Video,
  Edit,
  Save,
  Trash2,
  Eye,
  LogOut
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import AuthScreen from "@/components/AuthScreen";

type Screen = "home" | "workouts" | "progress" | "profile" | "contact" | "manage";

interface WorkoutDay {
  day: string;
  focus: string;
  exercises: {
    name: string;
    duration: string;
    repetitions: string;
    sets: string;
    equipment: string;
  }[];
}

interface Student {
  id: string;
  name: string;
  email: string;
  goal: string;
  level: string;
  weight: number;
  height: number;
  age: number;
  avatar_url?: string;
}

interface TrainingVideo {
  id: string;
  title: string;
  student_id: string;
  url: string;
  upload_date: string;
  type: "specific" | "live";
}

interface WorkoutLog {
  id: string;
  student_id: string;
  workout_day: string;
  completed_at: string;
  duration_minutes: number;
}

interface ProgressEntry {
  id: string;
  student_id: string;
  weight: number;
  date: string;
}

export default function EmersonPersonalApp() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [currentScreen, setCurrentScreen] = useState<Screen>("home");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedWorkoutDay, setSelectedWorkoutDay] = useState<WorkoutDay | null>(null);
  const [isWorkoutActive, setIsWorkoutActive] = useState(false);
  const [workoutTimer, setWorkoutTimer] = useState(0);
  
  // Real data from Supabase
  const [studentData, setStudentData] = useState<Student | null>(null);
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([]);
  const [progressEntries, setProgressEntries] = useState<ProgressEntry[]>([]);
  const [trainingVideos, setTrainingVideos] = useState<TrainingVideo[]>([]);
  
  // Manage screen states
  const [videoTitle, setVideoTitle] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [liveStreamUrl, setLiveStreamUrl] = useState("");
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [editingGoal, setEditingGoal] = useState(false);
  const [newGoal, setNewGoal] = useState("");

  // Load user data from Supabase
  useEffect(() => {
    if (user) {
      loadStudentData();
      loadWorkoutLogs();
      loadProgressEntries();
      loadTrainingVideos();
    }
  }, [user]);

  const loadStudentData = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from("students")
      .select("*")
      .eq("id", user.id)
      .single();

    if (data) {
      setStudentData(data);
      setNewGoal(data.goal);
    }
  };

  const loadWorkoutLogs = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from("workout_logs")
      .select("*")
      .eq("student_id", user.id)
      .order("completed_at", { ascending: false });

    if (data) setWorkoutLogs(data);
  };

  const loadProgressEntries = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from("progress_entries")
      .select("*")
      .eq("student_id", user.id)
      .order("date", { ascending: false })
      .limit(8);

    if (data) setProgressEntries(data);
  };

  const loadTrainingVideos = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from("training_videos")
      .select("*")
      .or(`student_id.eq.${user.id},student_id.is.null`)
      .order("created_at", { ascending: false });

    if (data) setTrainingVideos(data);
  };

  const handleUpdateGoal = async () => {
    if (!user || !newGoal.trim()) return;

    const { error } = await supabase
      .from("students")
      .update({ goal: newGoal, updated_at: new Date().toISOString() })
      .eq("id", user.id);

    if (!error) {
      setEditingGoal(false);
      loadStudentData();
    }
  };

  const handleUploadVideo = async () => {
    if (!user || !videoTitle.trim() || !videoUrl.trim()) return;

    const { error } = await supabase
      .from("training_videos")
      .insert([
        {
          title: videoTitle,
          student_id: user.id,
          url: videoUrl,
          type: "specific",
        },
      ]);

    if (!error) {
      setVideoTitle("");
      setVideoUrl("");
      loadTrainingVideos();
    }
  };

  const handleStartLive = async () => {
    if (!liveStreamUrl.trim()) return;

    const { error } = await supabase
      .from("training_videos")
      .insert([
        {
          title: "Aula ao Vivo - " + new Date().toLocaleString("pt-BR"),
          student_id: null, // null = todos os alunos
          url: liveStreamUrl,
          type: "live",
        },
      ]);

    if (!error) {
      setIsLiveActive(true);
      loadTrainingVideos();
    }
  };

  const handleDeleteVideo = async (videoId: string) => {
    const { error } = await supabase
      .from("training_videos")
      .delete()
      .eq("id", videoId);

    if (!error) {
      loadTrainingVideos();
    }
  };

  const handleCompleteWorkout = async (workoutDay: string, durationMinutes: number) => {
    if (!user) return;

    const { error } = await supabase
      .from("workout_logs")
      .insert([
        {
          student_id: user.id,
          workout_day: workoutDay,
          duration_minutes: durationMinutes,
        },
      ]);

    if (!error) {
      loadWorkoutLogs();
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setStudentData(null);
  };

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isWorkoutActive) {
      interval = setInterval(() => {
        setWorkoutTimer(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isWorkoutActive]);

  // Mock workout data - Emerson's Training Plan
  const workoutPlan: WorkoutDay[] = [
    {
      day: "Segunda-feira",
      focus: "Peito e Tríceps",
      exercises: [
        {
          name: "Supino Reto com Barra",
          duration: "N/A",
          repetitions: "8-12",
          sets: "4",
          equipment: "Barra, Banco"
        },
        {
          name: "Supino Inclinado com Halteres",
          duration: "N/A",
          repetitions: "10-12",
          sets: "3",
          equipment: "Halteres, Banco Inclinado"
        },
        {
          name: "Crucifixo no Cabo",
          duration: "N/A",
          repetitions: "12-15",
          sets: "3",
          equipment: "Máquina de Cabo"
        },
        {
          name: "Tríceps Testa",
          duration: "N/A",
          repetitions: "10-12",
          sets: "3",
          equipment: "Barra W"
        },
        {
          name: "Tríceps Corda",
          duration: "N/A",
          repetitions: "12-15",
          sets: "3",
          equipment: "Cabo, Corda"
        }
      ]
    },
    {
      day: "Terça-feira",
      focus: "Costas e Bíceps",
      exercises: [
        {
          name: "Barra Fixa",
          duration: "N/A",
          repetitions: "8-12",
          sets: "4",
          equipment: "Barra Fixa"
        },
        {
          name: "Remada Curvada",
          duration: "N/A",
          repetitions: "8-12",
          sets: "4",
          equipment: "Barra"
        },
        {
          name: "Puxada Frontal",
          duration: "N/A",
          repetitions: "10-12",
          sets: "3",
          equipment: "Máquina"
        },
        {
          name: "Rosca Direta",
          duration: "N/A",
          repetitions: "10-12",
          sets: "3",
          equipment: "Barra"
        },
        {
          name: "Rosca Martelo",
          duration: "N/A",
          repetitions: "12-15",
          sets: "3",
          equipment: "Halteres"
        }
      ]
    },
    {
      day: "Quarta-feira",
      focus: "Pernas Completo",
      exercises: [
        {
          name: "Agachamento Livre",
          duration: "N/A",
          repetitions: "8-12",
          sets: "4",
          equipment: "Barra, Rack"
        },
        {
          name: "Leg Press 45°",
          duration: "N/A",
          repetitions: "10-15",
          sets: "4",
          equipment: "Máquina Leg Press"
        },
        {
          name: "Cadeira Extensora",
          duration: "N/A",
          repetitions: "12-15",
          sets: "3",
          equipment: "Máquina"
        },
        {
          name: "Mesa Flexora",
          duration: "N/A",
          repetitions: "12-15",
          sets: "3",
          equipment: "Máquina"
        },
        {
          name: "Panturrilha em Pé",
          duration: "N/A",
          repetitions: "15-20",
          sets: "4",
          equipment: "Máquina"
        }
      ]
    },
    {
      day: "Quinta-feira",
      focus: "Ombros e Abdômen",
      exercises: [
        {
          name: "Desenvolvimento com Barra",
          duration: "N/A",
          repetitions: "8-12",
          sets: "4",
          equipment: "Barra"
        },
        {
          name: "Elevação Lateral",
          duration: "N/A",
          repetitions: "12-15",
          sets: "3",
          equipment: "Halteres"
        },
        {
          name: "Elevação Frontal",
          duration: "N/A",
          repetitions: "12-15",
          sets: "3",
          equipment: "Halteres"
        },
        {
          name: "Crucifixo Inverso",
          duration: "N/A",
          repetitions: "12-15",
          sets: "3",
          equipment: "Halteres"
        },
        {
          name: "Abdominais Completo",
          duration: "15 min",
          repetitions: "N/A",
          sets: "3",
          equipment: "Nenhum"
        }
      ]
    },
    {
      day: "Sexta-feira",
      focus: "Treino Funcional",
      exercises: [
        {
          name: "Burpees",
          duration: "N/A",
          repetitions: "15",
          sets: "4",
          equipment: "Nenhum"
        },
        {
          name: "Kettlebell Swing",
          duration: "N/A",
          repetitions: "20",
          sets: "4",
          equipment: "Kettlebell"
        },
        {
          name: "Box Jump",
          duration: "N/A",
          repetitions: "12",
          sets: "3",
          equipment: "Box"
        },
        {
          name: "Battle Rope",
          duration: "30 seg",
          repetitions: "N/A",
          sets: "4",
          equipment: "Corda Naval"
        },
        {
          name: "Prancha Dinâmica",
          duration: "1 min",
          repetitions: "N/A",
          sets: "3",
          equipment: "Nenhum"
        }
      ]
    }
  ];

  // Calculate stats from real data
  const thisWeekLogs = workoutLogs.filter(log => {
    const logDate = new Date(log.completed_at);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return logDate >= weekAgo;
  });

  const streak = workoutLogs.length > 0 ? calculateStreak(workoutLogs) : 0;

  function calculateStreak(logs: WorkoutLog[]): number {
    if (logs.length === 0) return 0;
    
    let currentStreak = 1;
    const sortedLogs = [...logs].sort((a, b) => 
      new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime()
    );

    for (let i = 0; i < sortedLogs.length - 1; i++) {
      const current = new Date(sortedLogs[i].completed_at);
      const next = new Date(sortedLogs[i + 1].completed_at);
      const diffDays = Math.floor((current.getTime() - next.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        currentStreak++;
      } else {
        break;
      }
    }
    
    return currentStreak;
  }

  const stats = [
    { 
      image: "https://k6hrqrxuu8obbfwn.public.blob.vercel-storage.com/temp/7b45bb25-4cec-44e1-b686-360230ea5ba6.jpg",
      label: "Calorias", 
      value: "3,250", 
      unit: "kcal", 
      color: "from-orange-500 to-red-500" 
    },
    { 
      image: "https://k6hrqrxuu8obbfwn.public.blob.vercel-storage.com/temp/57345a23-4496-41e8-83cc-9b7ffaaffd09.jpg",
      label: "Treinos", 
      value: thisWeekLogs.length.toString(), 
      unit: "/5", 
      color: "from-[#D4AF37] to-yellow-600" 
    },
    { 
      image: "https://k6hrqrxuu8obbfwn.public.blob.vercel-storage.com/temp/309ec221-2155-4b7f-bfee-6e42a1498ad6.jpg",
      label: "Sequência", 
      value: streak.toString(), 
      unit: "dias", 
      color: "from-[#00FF87] to-green-500" 
    },
    { 
      image: "https://k6hrqrxuu8obbfwn.public.blob.vercel-storage.com/temp/ad0acb54-6ff5-43c7-85e9-1381b8d3b9f8.jpg",
      label: "Nível", 
      value: studentData?.level || "Iniciante", 
      unit: "", 
      color: "from-purple-500 to-pink-500" 
    }
  ];

  const achievements = [
    { title: "Primeira Semana", description: "Complete 7 dias seguidos", completed: streak >= 7 },
    { title: "Mestre do Treino", description: "Complete 50 treinos", completed: workoutLogs.length >= 50, progress: Math.min((workoutLogs.length / 50) * 100, 100) },
    { title: "Transformação", description: "Alcance seu objetivo", completed: false, progress: 75 }
  ];

  // If not authenticated, show auth screen
  if (!user) {
    return <AuthScreen onAuthSuccess={setUser} />;
  }

  const renderManage = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Gerenciar Treinos</h2>
        <p className="text-white/60">Controle seus objetivos e vídeos</p>
      </div>

      {/* Edit Goal */}
      <div className="bg-gradient-to-br from-[#D4AF37]/10 to-black/40 backdrop-blur-sm rounded-xl p-6 border border-[#D4AF37]/20">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold flex items-center gap-2">
            <Target className="w-5 h-5 text-[#D4AF37]" />
            Seu Objetivo
          </h3>
          <button
            onClick={() => setEditingGoal(!editingGoal)}
            className="p-2 rounded-lg bg-[#D4AF37]/20 hover:bg-[#D4AF37]/30 transition-colors"
          >
            <Edit className="w-4 h-4 text-[#D4AF37]" />
          </button>
        </div>
        
        {editingGoal ? (
          <div className="space-y-3">
            <input
              type="text"
              value={newGoal}
              onChange={(e) => setNewGoal(e.target.value)}
              placeholder="Digite seu novo objetivo..."
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-[#D4AF37]/50 transition-colors"
            />
            <div className="flex gap-3">
              <button
                onClick={handleUpdateGoal}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#D4AF37] to-yellow-600 hover:shadow-lg hover:shadow-[#D4AF37]/50 transition-all duration-300 font-semibold text-black flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" />
                Salvar Objetivo
              </button>
              <button
                onClick={() => {
                  setEditingGoal(false);
                  setNewGoal(studentData?.goal || "");
                }}
                className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <p className="text-lg">{studentData?.goal}</p>
        )}
      </div>

      {/* Upload Training Video */}
      <div className="bg-black/40 backdrop-blur-sm rounded-xl p-6 border border-white/10">
        <h3 className="font-bold mb-4 flex items-center gap-2">
          <Upload className="w-5 h-5 text-[#00FF87]" />
          Adicionar Vídeo de Treino
        </h3>
        <div className="space-y-3">
          <input
            type="text"
            value={videoTitle}
            onChange={(e) => setVideoTitle(e.target.value)}
            placeholder="Título do vídeo..."
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-[#00FF87]/50 transition-colors"
          />
          <input
            type="url"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="URL do vídeo (YouTube, Vimeo, etc)..."
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-[#00FF87]/50 transition-colors"
          />
          <button
            onClick={handleUploadVideo}
            disabled={!videoTitle.trim() || !videoUrl.trim()}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-[#00FF87] to-green-500 hover:shadow-lg hover:shadow-[#00FF87]/50 transition-all duration-300 font-semibold text-black flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Upload className="w-5 h-5" />
            Enviar Vídeo
          </button>
        </div>
      </div>

      {/* My Videos */}
      <div className="bg-black/40 backdrop-blur-sm rounded-xl p-6 border border-white/10">
        <h3 className="font-bold mb-4 flex items-center gap-2">
          <Video className="w-5 h-5 text-[#D4AF37]" />
          Meus Vídeos de Treino
        </h3>
        <div className="space-y-3">
          {trainingVideos
            .filter(v => v.student_id === user?.id)
            .map((video) => (
              <div key={video.id} className="flex items-center gap-4 p-4 bg-white/5 rounded-lg border border-white/10">
                <div className="w-10 h-10 rounded-lg bg-[#D4AF37]/20 flex items-center justify-center">
                  <Video className="w-5 h-5 text-[#D4AF37]" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-sm">{video.title}</h4>
                  <p className="text-xs text-white/60">{video.upload_date}</p>
                </div>
                <a
                  href={video.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-[#00FF87]/20 hover:bg-[#00FF87]/30 transition-colors"
                >
                  <Eye className="w-4 h-4 text-[#00FF87]" />
                </a>
                <button
                  onClick={() => handleDeleteVideo(video.id)}
                  className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              </div>
            ))}
          {trainingVideos.filter(v => v.student_id === user?.id).length === 0 && (
            <p className="text-center text-white/40 py-8">Nenhum vídeo enviado ainda</p>
          )}
        </div>
      </div>

      {/* Live Classes */}
      <div className="bg-black/40 backdrop-blur-sm rounded-xl p-6 border border-white/10">
        <h3 className="font-bold mb-4 flex items-center gap-2">
          <Video className="w-5 h-5 text-red-500" />
          Aulas ao Vivo
        </h3>
        <div className="space-y-3">
          {trainingVideos
            .filter(v => v.type === "live")
            .map((video) => (
              <div key={video.id} className="flex items-center gap-4 p-4 bg-white/5 rounded-lg border border-white/10">
                <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                  <Video className="w-5 h-5 text-red-500" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-sm">{video.title}</h4>
                  <p className="text-xs text-white/60">{video.upload_date}</p>
                </div>
                <a
                  href={video.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-[#00FF87]/20 hover:bg-[#00FF87]/30 transition-colors"
                >
                  <Eye className="w-4 h-4 text-[#00FF87]" />
                </a>
              </div>
            ))}
          {trainingVideos.filter(v => v.type === "live").length === 0 && (
            <p className="text-center text-white/40 py-8">Nenhuma aula ao vivo disponível</p>
          )}
        </div>
      </div>
    </div>
  );

  const renderHome = () => (
    <div className="space-y-6">
      {/* Hero Section with Background Image */}
      <div 
        className="relative rounded-3xl overflow-hidden h-[400px] flex items-end"
        style={{
          backgroundImage: `linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.7) 100%), url('https://k6hrqrxuu8obbfwn.public.blob.vercel-storage.com/temp/c2145502-34e9-4831-b4dd-c428a506d652.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="p-8 w-full">
          <div className="flex items-center gap-4 mb-4">
            <div 
              className="w-20 h-20 rounded-full border-4 border-[#D4AF37] overflow-hidden"
              style={{
                backgroundImage: `url('https://k6hrqrxuu8obbfwn.public.blob.vercel-storage.com/temp/26706dde-9e44-48ae-9c13-3b94398bc02f.jpg')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            />
            <div>
              <h2 className="text-3xl font-bold text-[#D4AF37]">EG TREINADOR</h2>
              <p className="text-white/80 text-lg">Emerson Gonçalves</p>
              <p className="text-white/60 text-sm">Personal Trainer • CREF 123456-G/SP</p>
            </div>
          </div>
          <div className="bg-black/40 backdrop-blur-sm rounded-2xl p-4 border border-[#D4AF37]/30">
            <p className="text-white/90 text-sm leading-relaxed">
              "Transforme seu corpo, transforme sua vida. Treinos personalizados focados em <span className="text-[#D4AF37] font-semibold">DESEMPENHO E FORÇA</span>."
            </p>
          </div>
        </div>
      </div>

      {/* Welcome Section */}
      <div className="bg-gradient-to-br from-[#D4AF37]/20 to-[#D4AF37]/5 rounded-2xl p-6 border border-[#D4AF37]/30">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold mb-1">Olá, {studentData?.name}! 💪</h2>
            <p className="text-white/60">Seu treino de hoje está pronto</p>
          </div>
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#D4AF37] to-yellow-600 flex items-center justify-center">
            <Dumbbell className="w-8 h-8 text-black" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 h-3 bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-[#D4AF37] to-[#00FF87] rounded-full transition-all duration-500"
              style={{ width: `${(thisWeekLogs.length / 5) * 100}%` }}
            />
          </div>
          <span className="text-sm font-medium text-[#D4AF37]">
            {thisWeekLogs.length}/5
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-black/40 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:border-[#D4AF37]/30 transition-all duration-300">
            <div 
              className="w-10 h-10 rounded-lg mb-3 overflow-hidden"
              style={{
                backgroundImage: `url('${stat.image}')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            />
            <p className="text-xs text-white/60 mb-1">{stat.label}</p>
            <p className="text-2xl font-bold">
              {stat.value}
              <span className="text-sm text-white/60 ml-1">{stat.unit}</span>
            </p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-lg font-bold mb-4">Ações Rápidas</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <button
            onClick={() => setCurrentScreen("workouts")}
            className="group bg-gradient-to-br from-[#D4AF37]/20 to-[#D4AF37]/5 hover:from-[#D4AF37]/30 hover:to-[#D4AF37]/10 rounded-xl p-6 border border-[#D4AF37]/30 transition-all duration-300 text-left"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-lg bg-[#D4AF37]/20 flex items-center justify-center">
                <Play className="w-6 h-6 text-[#D4AF37]" />
              </div>
              <ChevronRight className="w-5 h-5 text-[#D4AF37] group-hover:translate-x-1 transition-transform" />
            </div>
            <h4 className="font-bold mb-1">Iniciar Treino</h4>
            <p className="text-sm text-white/60">Comece seu treino de hoje</p>
          </button>

          <button
            onClick={() => setCurrentScreen("contact")}
            className="group bg-black/40 backdrop-blur-sm hover:bg-black/60 rounded-xl p-6 border border-white/10 hover:border-[#00FF87]/30 transition-all duration-300 text-left"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-lg bg-[#00FF87]/20 flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-[#00FF87]" />
              </div>
              <ChevronRight className="w-5 h-5 text-white/60 group-hover:translate-x-1 transition-transform" />
            </div>
            <h4 className="font-bold mb-1">Falar com Emerson</h4>
            <p className="text-sm text-white/60">Tire suas dúvidas</p>
          </button>
        </div>
      </div>

      {/* Achievements */}
      <div>
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Award className="w-5 h-5 text-[#D4AF37]" />
          Suas Conquistas
        </h3>
        <div className="space-y-3">
          {achievements.map((achievement, idx) => (
            <div key={idx} className="bg-black/40 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${achievement.completed ? 'bg-gradient-to-br from-[#D4AF37] to-yellow-600' : 'bg-white/5'}`}>
                  <Award className={`w-6 h-6 ${achievement.completed ? 'text-black' : 'text-white/40'}`} />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold mb-1">{achievement.title}</h4>
                  <p className="text-sm text-white/60">{achievement.description}</p>
                  {!achievement.completed && achievement.progress && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-[#D4AF37] to-[#00FF87] rounded-full"
                          style={{ width: `${achievement.progress}%` }}
                        />
                      </div>
                      <span className="text-xs text-white/60">{achievement.progress}%</span>
                    </div>
                  )}
                </div>
                {achievement.completed && (
                  <CheckCircle className="w-5 h-5 text-[#00FF87]" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderWorkouts = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Plano de Treino Emerson</h2>
        <p className="text-white/60">Programa personalizado para seus objetivos</p>
      </div>

      {selectedWorkoutDay ? (
        <div className="space-y-4">
          <button
            onClick={() => setSelectedWorkoutDay(null)}
            className="flex items-center gap-2 text-[#D4AF37] hover:text-[#D4AF37]/80 transition-colors"
          >
            <ChevronRight className="w-4 h-4 rotate-180" />
            Voltar aos treinos
          </button>

          <div className="bg-gradient-to-br from-[#D4AF37]/20 to-[#D4AF37]/5 rounded-2xl p-6 border border-[#D4AF37]/30">
            <h3 className="text-xl font-bold mb-2">{selectedWorkoutDay.day}</h3>
            <p className="text-[#D4AF37] mb-4">{selectedWorkoutDay.focus}</p>
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  if (!isWorkoutActive) {
                    setIsWorkoutActive(true);
                    setWorkoutTimer(0);
                  } else {
                    setIsWorkoutActive(false);
                    handleCompleteWorkout(selectedWorkoutDay.day, Math.floor(workoutTimer / 60));
                  }
                }}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#D4AF37] to-yellow-600 hover:shadow-lg hover:shadow-[#D4AF37]/50 transition-all duration-300 font-semibold text-black flex items-center gap-2"
              >
                {isWorkoutActive ? (
                  <>
                    <Pause className="w-5 h-5" />
                    Finalizar Treino
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5" />
                    Iniciar Treino
                  </>
                )}
              </button>
              {isWorkoutActive && (
                <div className="flex items-center gap-2 text-[#D4AF37]">
                  <Clock className="w-5 h-5" />
                  <span className="font-mono font-bold text-xl">
                    {Math.floor(workoutTimer / 60)}:{(workoutTimer % 60).toString().padStart(2, '0')}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            {selectedWorkoutDay.exercises.map((exercise, idx) => (
              <div key={idx} className="bg-black/40 backdrop-blur-sm rounded-xl p-5 border border-white/10 hover:border-[#D4AF37]/30 transition-all duration-300">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-bold mb-1">{exercise.name}</h4>
                    <p className="text-sm text-white/60">{exercise.equipment}</p>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/20 flex items-center justify-center">
                    <span className="text-sm font-bold text-[#D4AF37]">{idx + 1}</span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  {exercise.sets !== "N/A" && (
                    <div>
                      <p className="text-xs text-white/60 mb-1">Séries</p>
                      <p className="font-semibold text-[#D4AF37]">{exercise.sets}</p>
                    </div>
                  )}
                  {exercise.repetitions !== "N/A" && (
                    <div>
                      <p className="text-xs text-white/60 mb-1">Repetições</p>
                      <p className="font-semibold">{exercise.repetitions}</p>
                    </div>
                  )}
                  {exercise.duration !== "N/A" && (
                    <div>
                      <p className="text-xs text-white/60 mb-1">Duração</p>
                      <p className="font-semibold">{exercise.duration}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {workoutPlan.map((day, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedWorkoutDay(day)}
              className="group bg-black/40 backdrop-blur-sm hover:bg-black/60 rounded-xl p-6 border border-white/10 hover:border-[#D4AF37]/30 transition-all duration-300 text-left"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#D4AF37] to-yellow-600 flex items-center justify-center">
                  <Dumbbell className="w-6 h-6 text-black" />
                </div>
                <ChevronRight className="w-5 h-5 text-white/60 group-hover:translate-x-1 transition-transform" />
              </div>
              <h3 className="font-bold mb-1">{day.day}</h3>
              <p className="text-sm text-[#D4AF37] mb-2">{day.focus}</p>
              <p className="text-sm text-white/60">{day.exercises.length} exercícios</p>
              <div className="mt-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-white/40" />
                <span className="text-sm text-white/60">~60-75 minutos</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );

  const renderProgress = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Seu Progresso</h2>
        <p className="text-white/60">Acompanhe sua evolução com Emerson</p>
      </div>

      {/* Progress Summary */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="bg-black/40 backdrop-blur-sm rounded-xl p-5 border border-white/10">
          <div 
            className="w-10 h-10 rounded-lg mb-3 overflow-hidden"
            style={{
              backgroundImage: `url('https://k6hrqrxuu8obbfwn.public.blob.vercel-storage.com/temp/57345a23-4496-41e8-83cc-9b7ffaaffd09.jpg')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          />
          <p className="text-2xl font-bold mb-1">{workoutLogs.length}</p>
          <p className="text-sm text-white/60">Treinos Completos</p>
        </div>
        <div className="bg-black/40 backdrop-blur-sm rounded-xl p-5 border border-white/10">
          <div 
            className="w-10 h-10 rounded-lg mb-3 overflow-hidden"
            style={{
              backgroundImage: `url('https://k6hrqrxuu8obbfwn.public.blob.vercel-storage.com/temp/309ec221-2155-4b7f-bfee-6e42a1498ad6.jpg')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          />
          <p className="text-2xl font-bold mb-1">{streak}</p>
          <p className="text-sm text-white/60">Dias de Sequência</p>
        </div>
        <div className="bg-black/40 backdrop-blur-sm rounded-xl p-5 border border-white/10">
          <div 
            className="w-10 h-10 rounded-lg mb-3 overflow-hidden"
            style={{
              backgroundImage: `url('https://k6hrqrxuu8obbfwn.public.blob.vercel-storage.com/temp/ad0acb54-6ff5-43c7-85e9-1381b8d3b9f8.jpg')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          />
          <p className="text-2xl font-bold mb-1">98%</p>
          <p className="text-sm text-white/60">Taxa de Conclusão</p>
        </div>
      </div>

      {/* Weight Progress */}
      <div className="bg-black/40 backdrop-blur-sm rounded-xl p-6 border border-white/10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-bold mb-1">Evolução de Peso</h3>
            <p className="text-sm text-white/60">Últimas 8 semanas</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-[#D4AF37]">{studentData?.weight}kg</p>
            {progressEntries.length > 1 && (
              <p className="text-sm text-[#00FF87]">
                {(progressEntries[0].weight - progressEntries[progressEntries.length - 1].weight).toFixed(1)}kg
              </p>
            )}
          </div>
        </div>
        <div className="space-y-3">
          {progressEntries.map((entry, idx) => (
            <div key={entry.id} className="flex items-center gap-4">
              <span className="text-sm text-white/60 w-24">{new Date(entry.date).toLocaleDateString('pt-BR')}</span>
              <div className="flex-1 h-8 bg-white/5 rounded-lg overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-[#D4AF37] to-[#00FF87] rounded-lg flex items-center justify-end pr-3"
                  style={{ width: `${(entry.weight / (studentData?.weight || 70)) * 100}%` }}
                >
                  <span className="text-xs font-bold">{entry.weight}kg</span>
                </div>
              </div>
            </div>
          ))}
          {progressEntries.length === 0 && (
            <p className="text-center text-white/40 py-8">Nenhum registro de peso ainda</p>
          )}
        </div>
      </div>

      {/* Weekly Activity */}
      <div className="bg-black/40 backdrop-blur-sm rounded-xl p-6 border border-white/10">
        <h3 className="font-bold mb-4">Atividade Semanal</h3>
        <div className="grid grid-cols-7 gap-2">
          {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, idx) => {
            const hasWorkout = thisWeekLogs.some(log => {
              const logDate = new Date(log.completed_at);
              return logDate.getDay() === idx;
            });
            return (
              <div key={idx} className="text-center">
                <p className="text-xs text-white/60 mb-2">{day}</p>
                <div className={`aspect-square rounded-lg ${hasWorkout ? 'bg-gradient-to-br from-[#D4AF37] to-yellow-600' : 'bg-white/5'}`} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderProfile = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Perfil</h2>
        <p className="text-white/60">Suas informações e configurações</p>
      </div>

      {/* User Info Card */}
      <div className="bg-gradient-to-br from-[#D4AF37]/20 to-[#D4AF37]/5 rounded-2xl p-6 border border-[#D4AF37]/30">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#D4AF37] to-yellow-600 flex items-center justify-center text-2xl font-bold text-black">
            {studentData?.name[0]}
          </div>
          <div>
            <h3 className="text-xl font-bold mb-1">{studentData?.name}</h3>
            <p className="text-white/60 text-sm">Aluno de Emerson Gonçalves</p>
            <p className="text-[#D4AF37] text-sm font-semibold">{studentData?.level}</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-[#D4AF37]">{studentData?.weight}kg</p>
            <p className="text-xs text-white/60">Peso</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-[#D4AF37]">{studentData?.height}cm</p>
            <p className="text-xs text-white/60">Altura</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-[#D4AF37]">{studentData?.age}</p>
            <p className="text-xs text-white/60">Anos</p>
          </div>
        </div>
      </div>

      {/* Goal */}
      <div className="bg-black/40 backdrop-blur-sm rounded-xl p-6 border border-white/10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-[#D4AF37]/20 flex items-center justify-center">
            <Target className="w-5 h-5 text-[#D4AF37]" />
          </div>
          <h3 className="font-bold">Objetivo Atual</h3>
        </div>
        <p className="text-lg">{studentData?.goal}</p>
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-full flex items-center justify-center gap-3 p-4 bg-red-500/20 hover:bg-red-500/30 rounded-xl border border-red-500/30 transition-all duration-300 text-red-400 font-semibold"
      >
        <LogOut className="w-5 h-5" />
        Sair da Conta
      </button>
    </div>
  );

  const renderContact = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Contato</h2>
        <p className="text-white/60">Fale diretamente com Emerson</p>
      </div>

      {/* Trainer Card */}
      <div 
        className="relative rounded-3xl overflow-hidden h-[300px] flex items-end"
        style={{
          backgroundImage: `linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.3) 100%), url('https://k6hrqrxuu8obbfwn.public.blob.vercel-storage.com/temp/c2145502-34e9-4831-b4dd-c428a506d652.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="p-6 w-full">
          <div className="flex items-center gap-4 mb-4">
            <div 
              className="w-16 h-16 rounded-full border-4 border-[#D4AF37]"
              style={{
                backgroundImage: `url('https://k6hrqrxuu8obbfwn.public.blob.vercel-storage.com/temp/26706dde-9e44-48ae-9c13-3b94398bc02f.jpg')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            />
            <div>
              <h3 className="text-2xl font-bold text-[#D4AF37]">Emerson Gonçalves</h3>
              <p className="text-white/80">Personal Trainer</p>
              <p className="text-white/60 text-sm">CREF 123456-G/SP</p>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Methods */}
      <div className="space-y-3">
        <a 
          href="https://l.instagram.com/?u=https%3A%2F%2Fwa.me%2F5544998517802%3Futm_source%3Dig%26utm_medium%3Dsocial%26utm_content%3Dlink_in_bio%26fbclid%3DPAZXh0bgNhZW0CMTEAc3J0YwZhcHBfaWQMMjU2MjgxMDQwNTU4AAGn9jxQFnrEGDKWmA4IVgSGGs_v6P7zbKtMZ0990HEO0pDg1TkZ__KVLDBn7_Q_aem_YxSuPxhV0MNccaF7L_n8WA%26brid%3DIbYJevdw2JI17vl_SlUmSg&e=AT1khsrMGPGjC8l9x3_YyXc2UY_CsUtlvcrokHKPxCnrUJqFzkWv4oStJ16hfma4O6-aDkSdXLXjNtciOEYpn_QqNTaCePYwrv3Ne5RLVLN2kH2eBelmuycDug"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-4 p-5 bg-gradient-to-br from-[#00FF87]/20 to-[#00FF87]/5 hover:from-[#00FF87]/30 hover:to-[#00FF87]/10 rounded-xl border border-[#00FF87]/30 transition-all duration-300"
        >
          <div className="w-12 h-12 rounded-lg bg-[#00FF87]/20 flex items-center justify-center">
            <MessageCircle className="w-6 h-6 text-[#00FF87]" />
          </div>
          <div className="flex-1">
            <h4 className="font-bold mb-1">WhatsApp</h4>
            <p className="text-sm text-white/60">Resposta rápida</p>
          </div>
          <ChevronRight className="w-5 h-5 text-white/40" />
        </a>

        <a 
          href="mailto:emerson98517902@gmail.com"
          className="flex items-center gap-4 p-5 bg-black/40 backdrop-blur-sm hover:bg-black/60 rounded-xl border border-white/10 hover:border-[#D4AF37]/30 transition-all duration-300"
        >
          <div className="w-12 h-12 rounded-lg bg-[#D4AF37]/20 flex items-center justify-center">
            <Mail className="w-6 h-6 text-[#D4AF37]" />
          </div>
          <div className="flex-1">
            <h4 className="font-bold mb-1">E-mail</h4>
            <p className="text-sm text-white/60">emerson98517902@gmail.com</p>
          </div>
          <ChevronRight className="w-5 h-5 text-white/40" />
        </a>
      </div>

      {/* Quick Message */}
      <div className="bg-black/40 backdrop-blur-sm rounded-xl p-6 border border-white/10">
        <h3 className="font-bold mb-4">Enviar Mensagem Rápida</h3>
        <div className="space-y-3">
          <textarea 
            placeholder="Digite sua mensagem..."
            className="w-full h-32 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-[#D4AF37]/50 transition-colors resize-none"
          />
          <button className="w-full py-3 rounded-xl bg-gradient-to-r from-[#D4AF37] to-yellow-600 hover:shadow-lg hover:shadow-[#D4AF37]/50 transition-all duration-300 font-semibold text-black flex items-center justify-center gap-2">
            <Send className="w-5 h-5" />
            Enviar Mensagem
          </button>
        </div>
      </div>

      {/* Social Media */}
      <div className="bg-gradient-to-br from-[#D4AF37]/10 to-black/40 backdrop-blur-sm rounded-xl p-6 border border-[#D4AF37]/20">
        <h3 className="font-bold mb-4">Redes Sociais</h3>
        <div className="flex gap-3">
          <a 
            href="https://www.instagram.com/treinador_emersong/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-3 rounded-xl bg-gradient-to-br from-pink-500 to-purple-500 hover:shadow-lg hover:shadow-pink-500/50 transition-all duration-300 font-semibold text-center"
          >
            Instagram
          </a>
          <a 
            href="https://t.me/treinadoremersong"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-3 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 hover:shadow-lg hover:shadow-blue-500/50 transition-all duration-300 font-semibold text-center"
          >
            Telegram
          </a>
        </div>
      </div>
    </div>
  );

  const navItems = [
    { id: "home" as Screen, icon: Home, label: "Início" },
    { id: "workouts" as Screen, icon: Dumbbell, label: "Treinos" },
    { id: "progress" as Screen, icon: BarChart3, label: "Progresso" },
    { id: "manage" as Screen, icon: Users, label: "Gerenciar" },
    { id: "contact" as Screen, icon: MessageCircle, label: "Contato" },
    { id: "profile" as Screen, icon: User, label: "Perfil" }
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-xl border-b border-[#D4AF37]/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-xl overflow-hidden border-2 border-[#D4AF37]"
                style={{
                  backgroundImage: `url('https://k6hrqrxuu8obbfwn.public.blob.vercel-storage.com/temp/26706dde-9e44-48ae-9c13-3b94398bc02f.jpg')`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              />
              <div>
                <h1 className="text-lg font-bold text-[#D4AF37]">EG TREINADOR</h1>
                <p className="text-xs text-white/40">Emerson Gonçalves</p>
              </div>
            </div>

            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 transition-all duration-300 flex items-center justify-center"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="pt-16 lg:pl-64">
        {/* Sidebar - Desktop */}
        <aside className="hidden lg:block fixed left-0 top-16 bottom-0 w-64 bg-black border-r border-white/10 p-6 overflow-y-auto">
          <nav className="space-y-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setCurrentScreen(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                  currentScreen === item.id
                    ? 'bg-gradient-to-r from-[#D4AF37] to-yellow-600 text-black shadow-lg shadow-[#D4AF37]/20'
                    : 'bg-white/5 hover:bg-white/10 text-white/60 hover:text-white'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 top-16 bg-black/95 backdrop-blur-xl z-40 p-6">
            <nav className="space-y-2">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setCurrentScreen(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                    currentScreen === item.id
                      ? 'bg-gradient-to-r from-[#D4AF37] to-yellow-600 text-black shadow-lg shadow-[#D4AF37]/20'
                      : 'bg-white/5 hover:bg-white/10 text-white/60 hover:text-white'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}
            </nav>
          </div>
        )}

        {/* Content Area */}
        <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto pb-24 lg:pb-8">
          {currentScreen === "home" && renderHome()}
          {currentScreen === "workouts" && renderWorkouts()}
          {currentScreen === "progress" && renderProgress()}
          {currentScreen === "manage" && renderManage()}
          {currentScreen === "profile" && renderProfile()}
          {currentScreen === "contact" && renderContact()}
        </main>
      </div>

      {/* Bottom Navigation - Mobile */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-xl border-t border-[#D4AF37]/20 px-2 py-2 z-50">
        <div className="flex items-center justify-around">
          {navItems.slice(0, 5).map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentScreen(item.id)}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all duration-300 ${
                currentScreen === item.id
                  ? 'text-[#D4AF37]'
                  : 'text-white/40'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
