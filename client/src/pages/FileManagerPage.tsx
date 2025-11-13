import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { FileText, Folder, Download, Upload, Trash2, Plus, Save, Eye, Edit3, Terminal } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface FileItem {
  name: string;
  path: string;
  type: "file" | "directory";
  size?: number;
  content?: string;
}

export default function FileManagerPage() {
  const [currentPath, setCurrentPath] = useState("/");
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [editContent, setEditContent] = useState("");
  const [newFileName, setNewFileName] = useState("");
  const [newFolderName, setNewFolderName] = useState("");
  const [commandOutput, setCommandOutput] = useState("");
  const [shellCommand, setShellCommand] = useState("");
  const { toast } = useToast();

  // List directory contents
  const { data: files, isLoading } = useQuery<FileItem[]>({
    queryKey: ["/api/files/list", currentPath],
    queryFn: async () => {
      const response = await fetch(`/api/files/list?path=${encodeURIComponent(currentPath)}`);
      return response.json();
    },
  });

  // Read file content
  const readFileMutation = useMutation<{ content: string; path: string }, Error, string>({
    mutationFn: async (filePath: string) => {
      const response = await apiRequest("POST", "/api/files/read", { path: filePath });
      return response as { content: string; path: string };
    },
    onSuccess: (data) => {
      setEditContent(data.content);
      setSelectedFile({ name: data.path.split("/").pop() || "", path: data.path, type: "file" });
    },
  });

  // Write file content
  const writeFileMutation = useMutation({
    mutationFn: async ({ path, content }: { path: string; content: string }) => {
      return await apiRequest("POST", "/api/files/write", { path, content });
    },
    onSuccess: () => {
      toast({ title: "Fichier sauvegardé", description: "Le fichier a été modifié avec succès" });
      queryClient.invalidateQueries({ queryKey: ["/api/files/list"] });
    },
  });

  // Create new file
  const createFileMutation = useMutation({
    mutationFn: async ({ path, content }: { path: string; content: string }) => {
      return await apiRequest("POST", "/api/files/create", { path, content });
    },
    onSuccess: () => {
      toast({ title: "Fichier créé", description: "Le nouveau fichier a été créé avec succès" });
      setNewFileName("");
      queryClient.invalidateQueries({ queryKey: ["/api/files/list"] });
    },
  });

  // Create new folder
  const createFolderMutation = useMutation({
    mutationFn: async (path: string) => {
      return await apiRequest("POST", "/api/files/mkdir", { path });
    },
    onSuccess: () => {
      toast({ title: "Dossier créé", description: "Le nouveau dossier a été créé avec succès" });
      setNewFolderName("");
      queryClient.invalidateQueries({ queryKey: ["/api/files/list"] });
    },
  });

  // Delete file/folder
  const deleteMutation = useMutation({
    mutationFn: async (path: string) => {
      return await apiRequest("POST", "/api/files/delete", { path });
    },
    onSuccess: () => {
      toast({ title: "Supprimé", description: "L'élément a été supprimé avec succès" });
      queryClient.invalidateQueries({ queryKey: ["/api/files/list"] });
      setSelectedFile(null);
    },
  });

  // Execute shell command
  const executeCommandMutation = useMutation<{ output: string; error?: string }, Error, string>({
    mutationFn: async (command: string) => {
      const response = await apiRequest("POST", "/api/files/exec", { command });
      return response as { output: string; error?: string };
    },
    onSuccess: (data) => {
      setCommandOutput(data.error || data.output);
    },
  });

  const handleNavigate = (path: string) => {
    setCurrentPath(path);
    setSelectedFile(null);
  };

  const handleReadFile = (file: FileItem) => {
    if (file.type === "directory") {
      handleNavigate(file.path);
    } else {
      readFileMutation.mutate(file.path);
    }
  };

  const handleSaveFile = () => {
    if (selectedFile) {
      writeFileMutation.mutate({ path: selectedFile.path, content: editContent });
    }
  };

  const handleCreateFile = () => {
    if (newFileName) {
      const filePath = currentPath === "/" ? `/${newFileName}` : `${currentPath}/${newFileName}`;
      createFileMutation.mutate({ path: filePath, content: "" });
    }
  };

  const handleCreateFolder = () => {
    if (newFolderName) {
      const folderPath = currentPath === "/" ? `/${newFolderName}` : `${currentPath}/${newFolderName}`;
      createFolderMutation.mutate(folderPath);
    }
  };

  const handleExecuteCommand = () => {
    if (shellCommand.trim()) {
      executeCommandMutation.mutate(shellCommand);
    }
  };

  const handleGoUp = () => {
    const parts = currentPath.split("/").filter(Boolean);
    parts.pop();
    const newPath = parts.length > 0 ? `/${parts.join("/")}` : "/";
    setCurrentPath(newPath);
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Terminal className="h-6 w-6" />
              Gestionnaire de Fichiers & Shell
            </CardTitle>
            <CardDescription>
              Navigation complète, édition de fichiers et exécution de commandes shell
            </CardDescription>
          </CardHeader>
        </Card>

        <Tabs defaultValue="files" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="files" data-testid="tab-files">
              <FileText className="h-4 w-4 mr-2" />
              Fichiers
            </TabsTrigger>
            <TabsTrigger value="shell" data-testid="tab-shell">
              <Terminal className="h-4 w-4 mr-2" />
              Shell
            </TabsTrigger>
          </TabsList>

          <TabsContent value="files" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* File Browser */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Navigateur de Fichiers</CardTitle>
                  <div className="flex items-center gap-2 mt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleGoUp}
                      disabled={currentPath === "/"}
                      data-testid="button-go-up"
                    >
                      ← Retour
                    </Button>
                    <code className="text-xs bg-muted px-2 py-1 rounded flex-1">{currentPath}</code>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Create new file/folder */}
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Nouveau fichier..."
                        value={newFileName}
                        onChange={(e) => setNewFileName(e.target.value)}
                        data-testid="input-new-file"
                      />
                      <Button
                        size="sm"
                        onClick={handleCreateFile}
                        disabled={!newFileName}
                        data-testid="button-create-file"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Nouveau dossier..."
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        data-testid="input-new-folder"
                      />
                      <Button
                        size="sm"
                        onClick={handleCreateFolder}
                        disabled={!newFolderName}
                        data-testid="button-create-folder"
                      >
                        <Folder className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* File list */}
                  <div className="border rounded-lg max-h-96 overflow-y-auto">
                    {isLoading ? (
                      <div className="p-4 text-center text-muted-foreground">Chargement...</div>
                    ) : files && files.length > 0 ? (
                      <div className="divide-y">
                        {files.map((file) => (
                          <div
                            key={file.path}
                            className="flex items-center gap-2 p-2 hover:bg-muted cursor-pointer"
                            onClick={() => handleReadFile(file)}
                            data-testid={`file-item-${file.name}`}
                          >
                            {file.type === "directory" ? (
                              <Folder className="h-4 w-4 text-blue-500" />
                            ) : (
                              <FileText className="h-4 w-4 text-gray-500" />
                            )}
                            <span className="flex-1 text-sm">{file.name}</span>
                            {file.size && (
                              <span className="text-xs text-muted-foreground">
                                {(file.size / 1024).toFixed(1)} KB
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 text-center text-muted-foreground">Dossier vide</div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* File Editor */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center justify-between">
                    <span>Éditeur de Fichier</span>
                    {selectedFile && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleSaveFile}
                          disabled={writeFileMutation.isPending}
                          data-testid="button-save-file"
                        >
                          <Save className="h-4 w-4 mr-1" />
                          Sauvegarder
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => selectedFile && deleteMutation.mutate(selectedFile.path)}
                          disabled={deleteMutation.isPending}
                          data-testid="button-delete-file"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </CardTitle>
                  {selectedFile && (
                    <code className="text-xs bg-muted px-2 py-1 rounded block mt-2">
                      {selectedFile.path}
                    </code>
                  )}
                </CardHeader>
                <CardContent>
                  {selectedFile ? (
                    <Textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="font-mono text-xs min-h-96"
                      placeholder="Contenu du fichier..."
                      data-testid="textarea-file-content"
                    />
                  ) : (
                    <div className="border rounded-lg p-8 text-center text-muted-foreground min-h-96 flex items-center justify-center">
                      <div>
                        <Edit3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>Sélectionnez un fichier pour l'éditer</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="shell" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Terminal Shell</CardTitle>
                <CardDescription>Exécutez des commandes shell directement</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <AlertDescription>
                    ⚠️ Attention: Les commandes sont exécutées avec permissions complètes (777)
                  </AlertDescription>
                </Alert>

                <div className="flex gap-2">
                  <Input
                    placeholder="Entrez une commande shell..."
                    value={shellCommand}
                    onChange={(e) => setShellCommand(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleExecuteCommand()}
                    className="font-mono"
                    data-testid="input-shell-command"
                  />
                  <Button
                    onClick={handleExecuteCommand}
                    disabled={executeCommandMutation.isPending || !shellCommand.trim()}
                    data-testid="button-execute-command"
                  >
                    <Terminal className="h-4 w-4 mr-2" />
                    Exécuter
                  </Button>
                </div>

                {commandOutput && (
                  <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
                    <pre className="whitespace-pre-wrap">{commandOutput}</pre>
                  </div>
                )}

                <div className="text-xs text-muted-foreground space-y-1">
                  <p><strong>Exemples de commandes:</strong></p>
                  <code className="block">ls -la</code>
                  <code className="block">pwd</code>
                  <code className="block">cat package.json</code>
                  <code className="block">chmod 777 fichier.txt</code>
                  <code className="block">mkdir nouveau_dossier</code>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
