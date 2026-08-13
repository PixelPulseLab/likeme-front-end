import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { BackgroundIconOutline } from '@/assets/ui';
import { IconButton } from '@/components/ui/buttons';
import PostAttachmentsSection from '@/components/sections/community/PostAttachments/PostAttachmentsSection';
import { VideoPlayer } from '@/components/sections/program/VideoPlayer';
import { MarkdownText } from '@/components/ui/text/MarkdownText';
import { storageService } from '@/services';
import type { Attachment } from '@/types/attachment';
import { COLORS } from '@/constants';
import { logger } from '@/utils/logger';
import { styles } from './styles';

export type ModuleItem = {
  id: string;
  title: string;
  completed?: boolean;
  body?: string | null;
  attachments: Attachment[];
  video?: Attachment | null;
};

type Props = {
  modules: ModuleItem[];
  storageScopeId?: string;
  onModulePress?: (module: ModuleItem) => void;
  expandedModuleId?: string | null;
  onExpandedModuleChange?: (moduleId: string | null) => void;
};

const ModuleAccordion: React.FC<Props> = ({
  modules,
  storageScopeId,
  onModulePress,
  expandedModuleId: expandedModuleIdProp,
  onExpandedModuleChange,
}) => {
  const [internalExpandedId, setInternalExpandedId] = useState<string | null>(null);
  const [completedModuleIds, setCompletedModuleIds] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    for (const module of modules) {
      if (module.completed) {
        initial.add(module.id);
      }
    }
    return initial;
  });

  const isControlled = onExpandedModuleChange != null;
  const expandedId = isControlled ? expandedModuleIdProp ?? null : internalExpandedId;
  const moduleIdsKey = useMemo(() => modules.map((module) => module.id).join('|'), [modules]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const initialCompleted = new Set<string>();
      for (const module of modules) {
        if (module.completed) {
          initialCompleted.add(module.id);
        }
      }

      if (!storageScopeId) {
        if (!cancelled) {
          setCompletedModuleIds(initialCompleted);
        }
        return;
      }

      try {
        const storedCompleted = await storageService.getProgramModuleCompletedIds(storageScopeId);
        for (const moduleId of storedCompleted) {
          initialCompleted.add(moduleId);
        }
        if (!cancelled) {
          setCompletedModuleIds(initialCompleted);
        }
      } catch (error) {
        logger.error('Falha ao carregar módulos concluídos do programa', {
          storageScopeId,
          cause: error,
        });
        if (!cancelled) {
          setCompletedModuleIds(initialCompleted);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [storageScopeId, moduleIdsKey, modules]);

  const setExpandedId = (moduleId: string | null) => {
    if (isControlled) {
      onExpandedModuleChange(moduleId);
    } else {
      setInternalExpandedId(moduleId);
    }
  };

  const toggleExpand = (module: ModuleItem) => {
    if (expandedId === module.id) {
      setExpandedId(null);
    } else {
      setExpandedId(module.id);
      onModulePress?.(module);
    }
  };

  const toggleModuleCompleted = useCallback(
    (moduleId: string) => {
      setCompletedModuleIds((current) => {
        const next = new Set(current);
        const completed = !next.has(moduleId);
        if (completed) {
          next.add(moduleId);
        } else {
          next.delete(moduleId);
        }

        if (storageScopeId) {
          void storageService.setProgramModuleCompleted(storageScopeId, moduleId, completed).catch((error) => {
            logger.error('Falha ao salvar módulo concluído do programa', {
              storageScopeId,
              moduleId,
              completed,
              cause: error,
            });
            setCompletedModuleIds(current);
          });
        }

        return next;
      });
    },
    [storageScopeId],
  );

  return (
    <View style={styles.container}>
      {modules.map((module) => {
        const isExpanded = expandedId === module.id;
        const isCompleted = completedModuleIds.has(module.id);
        const moduleBackgroundColor = isExpanded ? COLORS.BACKGROUND_SECONDARY : COLORS.BACKGROUND;

        return (
          <View key={module.id} style={[styles.moduleItem, { backgroundColor: moduleBackgroundColor }]}>
            <View style={styles.moduleHeader}>
              <View style={styles.headerLeft}>
                {isCompleted ? (
                  <IconButton
                    showBackground
                    icon='check'
                    iconSize={16}
                    variant='dark'
                    backgroundTintColor={COLORS.NEUTRAL.LOW.PURE}
                    backgroundSize='small'
                    onPress={() => toggleModuleCompleted(module.id)}
                    containerStyle={styles.sessionIndicatorButton}
                    iconContainerStyle={styles.sessionIndicator}
                  />
                ) : (
                  <IconButton
                    showBackground={false}
                    iconElement={<BackgroundIconOutline width={29} height={26} color={moduleBackgroundColor} />}
                    onPress={() => toggleModuleCompleted(module.id)}
                    containerStyle={styles.sessionIndicatorButton}
                  />
                )}
                <TouchableOpacity
                  style={styles.moduleTitleButton}
                  onPress={() => toggleExpand(module)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.moduleTitle}>{module.title}</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity onPress={() => toggleExpand(module)} activeOpacity={0.7}>
                <Icon
                  name={isExpanded ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
                  size={28}
                  color={COLORS.NEUTRAL.LOW.PURE}
                />
              </TouchableOpacity>
            </View>
            {isExpanded ? (
              <View style={styles.moduleBody}>
                {module.video ? <VideoPlayer video={module.video} /> : null}
                <PostAttachmentsSection post={module} expanded>
                  {module.body?.trim() ? (
                    <MarkdownText style={styles.moduleBodyText} text={module.body.trim()} />
                  ) : null}
                </PostAttachmentsSection>
              </View>
            ) : null}
            <View style={styles.separator} />
          </View>
        );
      })}
    </View>
  );
};

export default ModuleAccordion;
