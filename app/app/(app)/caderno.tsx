import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Modal } from 'react-native';
import type { NotebookNote } from '@anesthequest/core';
import { Screen, Card, Button, Loading, ErrorState, EmptyState } from '@/components/ui';
import { useNotes, useCreateNote, useUpdateNote, useDeleteNote } from '@/hooks/useData';
import { colors, spacing, radius } from '@/theme/colors';

export default function Caderno() {
  const notes = useNotes();
  const createNote = useCreateNote();
  const updateNote = useUpdateNote();
  const deleteNote = useDeleteNote();
  const [editing, setEditing] = useState<NotebookNote | 'new' | null>(null);

  if (notes.isLoading) return <Loading />;
  if (notes.error) return <ErrorState error={notes.error} />;

  const list = notes.data ?? [];

  return (
    <Screen>
      <Button title="＋ Nova nota" onPress={() => setEditing('new')} />

      {list.length === 0 ? (
        <EmptyState title="Caderno vazio" subtitle="Crie notas de estudo vinculadas a temas." />
      ) : (
        list.map((n) => (
          <Card key={n.id} style={styles.note}>
            <Pressable style={{ flex: 1 }} onPress={() => setEditing(n)}>
              <Text style={styles.noteTitle}>{n.titulo}</Text>
              {n.conteudo ? (
                <Text style={styles.notePreview} numberOfLines={2}>
                  {n.conteudo}
                </Text>
              ) : null}
              <Text style={styles.noteDate}>{new Date(n.updated_at).toLocaleDateString('pt-BR')}</Text>
            </Pressable>
            <Pressable onPress={() => deleteNote.mutate(n.id)} hitSlop={8}>
              <Text style={styles.delete}>🗑</Text>
            </Pressable>
          </Card>
        ))
      )}

      <NoteModal
        key={editing === 'new' ? 'new' : editing?.id ?? 'closed'}
        note={editing}
        saving={createNote.isPending || updateNote.isPending}
        onClose={() => setEditing(null)}
        onSave={async (titulo, conteudo) => {
          if (editing === 'new') await createNote.mutateAsync({ titulo, conteudo });
          else if (editing) await updateNote.mutateAsync({ id: editing.id, patch: { titulo, conteudo } });
          setEditing(null);
        }}
      />
    </Screen>
  );
}

function NoteModal({
  note,
  saving,
  onClose,
  onSave,
}: {
  note: NotebookNote | 'new' | null;
  saving: boolean;
  onClose: () => void;
  onSave: (titulo: string, conteudo: string) => void;
}) {
  const initial = note && note !== 'new' ? note : null;
  // O componente é remontado por `key` no pai a cada nota, então o estado
  // inicializa corretamente; inputs controlados mantêm valor == estado.
  const [titulo, setTitulo] = useState(initial?.titulo ?? '');
  const [conteudo, setConteudo] = useState(initial?.conteudo ?? '');

  return (
    <Modal visible={note !== null} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>{note === 'new' ? 'Nova nota' : 'Editar nota'}</Text>
          <TextInput
            style={styles.input}
            placeholder="Título"
            placeholderTextColor={colors.textLight}
            value={titulo}
            onChangeText={setTitulo}
          />
          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder="Conteúdo"
            placeholderTextColor={colors.textLight}
            multiline
            value={conteudo}
            onChangeText={setConteudo}
          />
          <View style={styles.actions}>
            <Button title="Cancelar" variant="secondary" onPress={onClose} style={{ flex: 1 }} />
            <Button
              title="Salvar"
              onPress={() => onSave(titulo.trim() || 'Sem título', conteudo)}
              loading={saving}
              style={{ flex: 1 }}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  note: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  noteTitle: { fontWeight: '700', color: colors.textPrimary, fontSize: 16 },
  notePreview: { color: colors.textMuted, marginTop: 2 },
  noteDate: { color: colors.textLight, fontSize: 12, marginTop: spacing.xs },
  delete: { fontSize: 18 },
  backdrop: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: colors.bgLight,
    padding: spacing.lg,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    gap: spacing.md,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    color: colors.textPrimary,
  },
  textarea: { minHeight: 120, textAlignVertical: 'top' },
  actions: { flexDirection: 'row', gap: spacing.sm },
});
