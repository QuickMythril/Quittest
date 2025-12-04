import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  ToggleButtonGroup,
  ToggleButton,
  Typography,
  Button,
  IconButton,
  Box,
  TextField,
  InputAdornment,
  List,
  ListItemButton,
  ListItemText,
  CircularProgress,
  Chip,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import GroupIcon from '@mui/icons-material/Group';
import PersonIcon from '@mui/icons-material/Person';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import { useState, useEffect, MouseEvent, useMemo, useRef } from 'react';
import { useSearchUsers, UserSearchResult } from '../hooks/useSearchUsers';
import { useGlobal } from 'qapp-core';

// Provided by the Qortal runtime
declare const qortalRequest:
  | ((params: { action: string; address?: string }) => Promise<any>)
  | undefined;

type ForwardTarget = 'user' | 'group';

export interface ForwardSelection {
  target: ForwardTarget;
  user?: { name: string; address?: string };
}

interface ForwardModalProps {
  open: boolean;
  postId?: string;
  postName?: string;
  onClose: () => void;
  onSelectPath?: (target: ForwardTarget) => void;
  onConfirm?: (selection: ForwardSelection) => void;
}

export function ForwardModal({
  open,
  postId,
  postName,
  onClose,
  onSelectPath,
  onConfirm,
}: ForwardModalProps) {
  const { auth } = useGlobal();
  const [target, setTarget] = useState<ForwardTarget>('user');
  const [query, setQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(
    null
  );
  const { results, isLoading, error, searchUsers } = useSearchUsers();
  const isUserFlow = target === 'user';
  const [validationState, setValidationState] = useState<
    'idle' | 'checking' | 'valid' | 'invalid'
  >('idle');
  const [validationMessage, setValidationMessage] = useState<string>('');
  const validationRequestId = useRef(0);
  const [addressCheck, setAddressCheck] = useState<
    'idle' | 'checking' | 'valid' | 'invalid'
  >('idle');
  const lastSearchQueryRef = useRef<string>('');
  const [groups, setGroups] = useState<
    { groupId: number; groupName: string; memberCount?: number }[]
  >([]);
  const [groupFilter, setGroupFilter] = useState('');
  const [groupLoading, setGroupLoading] = useState(false);
  const [groupError, setGroupError] = useState<string | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const authAddress = auth?.address;

  useEffect(() => {
    if (!open) {
      setTarget('user');
      setQuery('');
      setSelectedUser(null);
      setValidationState('idle');
      setValidationMessage('');
      setAddressCheck('idle');
      setGroups([]);
      setGroupFilter('');
      setGroupError(null);
      setSelectedGroupId(null);
    }
  }, [open]);

  const handleChange = (_: MouseEvent<HTMLElement>, value: ForwardTarget) => {
    if (value) {
      setTarget(value);
      onSelectPath?.(value);
      // Reset selections when switching targets
      if (value !== 'user') {
        setSelectedUser(null);
        setValidationState('idle');
        setValidationMessage('');
      }
      if (value !== 'group') {
        setSelectedGroupId(null);
      }
    }
  };

  const validateAddressFormat = (value: string) => {
    const trimmed = value.trim();
    return /^Q[1-9A-HJ-NP-Za-km-z]{25,34}$/.test(trimmed);
  };

  const validateAddressApi = async (address: string): Promise<boolean> => {
    // Try qortalRequest first; fallback to fetch if available
    try {
      if (typeof qortalRequest === 'function') {
        const res = await qortalRequest({
          action: 'VALIDATE_ADDRESS',
          address,
        });
        if (typeof res === 'boolean') return res;
      }
    } catch (err) {
      console.error('Error validating address via qortalRequest:', err);
    }

    try {
      const origin =
        typeof window !== 'undefined' && window.location
          ? window.location.origin
          : '';
      const url = `${origin}/addresses/validate/${encodeURIComponent(address)}`;
      const resp = await fetch(url);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const text = (await resp.text()).trim();
      return text.toLowerCase() === 'true';
    } catch (err) {
      console.error('Error validating address via REST:', err);
      throw err;
    }
  };

  useEffect(() => {
    if (!isUserFlow) return;
    const trimmed = query.trim();
    if (!trimmed) {
      setSelectedUser(null);
      setValidationState('idle');
      setValidationMessage('');
      setAddressCheck('idle');
      return;
    }

    if (trimmed === lastSearchQueryRef.current) {
      return;
    }
    lastSearchQueryRef.current = trimmed;

    const currentId = ++validationRequestId.current;

    const isAddressCandidate = trimmed.startsWith('Q');

    if (isAddressCandidate) {
      if (!validateAddressFormat(trimmed)) {
        if (currentId === validationRequestId.current) {
          setValidationState('invalid');
          setValidationMessage('Invalid address format');
          setAddressCheck('invalid');
          setSelectedUser(null);
        }
        return;
      }

      if (currentId === validationRequestId.current) {
        setValidationState('checking');
        setValidationMessage('Checking address…');
        setAddressCheck('checking');
      }

      (async () => {
        try {
          const valid = await validateAddressApi(trimmed);
          if (currentId !== validationRequestId.current) return;
          if (valid) {
            setValidationState('valid');
            setValidationMessage('Valid address');
            setAddressCheck('valid');
            if (!selectedUser || selectedUser.name !== trimmed) {
              setSelectedUser({ name: trimmed, address: trimmed });
            }
          } else {
            setValidationState('invalid');
            setValidationMessage('Invalid address');
            setAddressCheck('invalid');
            setSelectedUser(null);
          }
        } catch {
          if (currentId !== validationRequestId.current) return;
          setValidationState('invalid');
          setValidationMessage('Could not validate address');
          setAddressCheck('invalid');
          setSelectedUser(null);
        }
      })();
      return;
    }

    // Reset address state for name flow; name validity decided after search results
    setAddressCheck('idle');
    setValidationState('checking');
    setValidationMessage('Searching name…');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, isUserFlow]);

  // Debounce name search (only when not using a valid address)
  useEffect(() => {
    if (!isUserFlow) return;
    const trimmed = query.trim();
    if (!trimmed) return;
    const isAddressCandidate = trimmed.startsWith('Q');
    if (isAddressCandidate && addressCheck !== 'invalid') return;

    const timer = setTimeout(() => {
      if (trimmed !== lastSearchQueryRef.current) {
        lastSearchQueryRef.current = trimmed;
      }
      searchUsers(trimmed);
    }, 500);

    return () => clearTimeout(timer);
  }, [query, searchUsers, isUserFlow, addressCheck]);

  // Evaluate name validity once search results return
  useEffect(() => {
    if (!isUserFlow) return;
    const trimmed = query.trim();
    if (!trimmed) return;
    const isAddressCandidate = trimmed.startsWith('Q');
    if (isAddressCandidate && addressCheck !== 'invalid') return;

    const exactMatch = results.find(
      (user) => user.name.toLowerCase() === trimmed.toLowerCase()
    );

    if (exactMatch) {
      setValidationState('valid');
      setValidationMessage('Valid name');
      setSelectedUser(exactMatch);
    } else {
      setValidationState('invalid');
      setValidationMessage('Name not found');
      setSelectedUser(null);
    }
  }, [results, isUserFlow, query, addressCheck]);

  const handleSelectUser = (user: UserSearchResult) => {
    setSelectedUser(user);
    setValidationState('valid');
    setValidationMessage(user.name.startsWith('Q') ? 'Valid address' : 'Valid name');
  };

  // Fetch joined groups when switching to group tab (if authenticated)
  useEffect(() => {
    const fetchGroups = async () => {
      if (isUserFlow) return;
      if (!authAddress) {
        setGroups([]);
        setGroupError('Authenticate to load your groups.');
        return;
      }
      if (groups.length) return;
      setGroupLoading(true);
      setGroupError(null);
      try {
        const origin =
          typeof window !== 'undefined' && window.location
            ? window.location.origin
            : '';
        const resp = await fetch(
          `${origin}/groups/member/${encodeURIComponent(authAddress)}`
        );
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const data = await resp.json();
        const mapped =
          Array.isArray(data) && data.length
            ? data.map((g: any) => ({
                groupId: g.groupId,
                groupName: g.groupName || `Group ${g.groupId}`,
                memberCount: g.memberCount,
              }))
            : [];
        setGroups(mapped);
      } catch (err) {
        console.error('Error fetching groups', err);
        setGroupError(
          err instanceof Error ? err.message : 'Failed to load groups'
        );
      } finally {
        setGroupLoading(false);
      }
    };

    fetchGroups();
  }, [isUserFlow, authAddress, groups.length]);

  const filteredGroups = useMemo(() => {
    const filter = groupFilter.trim().toLowerCase();
    if (!filter) return groups;
    return groups.filter((g) => {
      const idMatch = g.groupId.toString().includes(filter);
      const nameMatch = g.groupName.toLowerCase().includes(filter);
      return idMatch || nameMatch;
    });
  }, [groups, groupFilter]);

  const userOptions = useMemo(() => {
    if (!query.trim()) return results;
    return results;
  }, [results, query]);

  const canContinue =
    target === 'user'
      ? !!selectedUser && validationState === 'valid'
      : selectedGroupId !== null;

  const handleConfirm = () => {
    if (!canContinue) return;
    if (target === 'user' && selectedUser) {
      onConfirm?.({
        target,
        user: { name: selectedUser.name },
      });
      onClose();
    } else if (target === 'group' && selectedGroupId !== null) {
      onConfirm?.({
        target,
        groupId: selectedGroupId,
      } as any);
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      aria-labelledby="forward-modal-title"
    >
      <DialogTitle
        id="forward-modal-title"
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1,
          pb: 1,
        }}
      >
        Forward to chat
        <IconButton size="small" onClick={onClose} aria-label="Close">
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent
        dividers
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          pt: 2,
        }}
      >
        <Typography variant="body2" color="text.secondary">
          Choose whether to share this post with a user or a group. Recipient
          selection and sending will be added next.
        </Typography>

        <ToggleButtonGroup
          value={target}
          exclusive
          onChange={handleChange}
          fullWidth
          color="primary"
          size="small"
        >
          <ToggleButton value="user" aria-label="Share to user">
            <PersonIcon fontSize="small" sx={{ mr: 1 }} />
            User
          </ToggleButton>
          <ToggleButton value="group" aria-label="Share to group">
            <GroupIcon fontSize="small" sx={{ mr: 1 }} />
            Group
          </ToggleButton>
        </ToggleButtonGroup>

        {isUserFlow && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <TextField
              label="Search user or address"
              size="small"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
                endAdornment: query ? (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      aria-label="Clear search"
                      onClick={() => {
                        setQuery('');
                        setSelectedUser(null);
                      }}
                    >
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ) : null,
              }}
              placeholder="Type a name or address"
              fullWidth
              autoFocus
            />
            {validationState !== 'idle' && (
              <Typography
                variant="caption"
                color={
                  validationState === 'valid'
                    ? 'success.main'
                    : validationState === 'invalid'
                      ? 'error'
                      : 'text.secondary'
                }
                sx={{ minHeight: 18 }}
              >
                {validationMessage}
              </Typography>
            )}
            <Box
              sx={{
                minHeight: 140,
                maxHeight: 220,
                overflowY: 'auto',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
              }}
            >
              {isLoading ? (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: 140,
                    gap: 1,
                  }}
                >
                  <CircularProgress size={18} />
                  <Typography variant="body2" color="text.secondary">
                    Searching users...
                  </Typography>
                </Box>
              ) : error ? (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: 140,
                    px: 2,
                    textAlign: 'center',
                  }}
                >
                  <Typography variant="body2" color="error">
                    Failed to search users. Try again.
                  </Typography>
                </Box>
              ) : userOptions.length ? (
                <List dense disablePadding>
                  {userOptions.map((user) => (
                    <ListItemButton
                      key={user.name}
                      selected={selectedUser?.name === user.name}
                      onClick={() => handleSelectUser(user)}
                    >
                      <ListItemText
                        primary={user.name}
                        secondary={
                          user.postCount !== undefined
                            ? `${user.postCount} posts`
                            : undefined
                        }
                        primaryTypographyProps={{
                          fontWeight:
                            selectedUser?.name === user.name ? 700 : 500,
                        }}
                      />
                      {selectedUser?.name === user.name && (
                        <Chip
                          label="Selected"
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      )}
                    </ListItemButton>
                  ))}
                </List>
              ) : query.trim() ? (
                <List dense disablePadding>
                  <ListItemButton onClick={() => handleSelectUser({ name: query.trim() })}>
                    <ListItemText
                      primary={`Use "${query.trim()}"`}
                      secondary="No match found; forward to this name/address"
                    />
                  </ListItemButton>
                </List>
              ) : (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: 140,
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    Start typing to search for a user.
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        )}

        {!isUserFlow && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <TextField
              label="Filter groups"
              size="small"
              value={groupFilter}
              onChange={(e) => setGroupFilter(e.target.value)}
              placeholder="Type group name or ID"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
                endAdornment: groupFilter ? (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      aria-label="Clear group filter"
                      onClick={() => setGroupFilter('')}
                    >
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ) : null,
              }}
              fullWidth
            />

            <Box
              sx={{
                minHeight: 140,
                maxHeight: 220,
                overflowY: 'auto',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
              }}
            >
              {groupLoading ? (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: 140,
                    gap: 1,
                  }}
                >
                  <CircularProgress size={18} />
                  <Typography variant="body2" color="text.secondary">
                    Loading your groups...
                  </Typography>
                </Box>
              ) : groupError ? (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: 140,
                    px: 2,
                    textAlign: 'center',
                  }}
                >
                  <Typography variant="body2" color="error">
                    {groupError}
                  </Typography>
                </Box>
              ) : filteredGroups.length ? (
                <List dense disablePadding>
                  {filteredGroups.map((group) => (
                    <ListItemButton
                      key={group.groupId}
                      selected={selectedGroupId === group.groupId}
                      onClick={() => setSelectedGroupId(group.groupId)}
                    >
                      <ListItemText
                        primary={group.groupName}
                        secondary={`ID: ${group.groupId}${
                          group.memberCount !== undefined
                            ? ` · ${group.memberCount} members`
                            : ''
                        }`}
                        primaryTypographyProps={{
                          fontWeight:
                            selectedGroupId === group.groupId ? 700 : 500,
                        }}
                      />
                      {selectedGroupId === group.groupId && (
                        <Chip
                          label="Selected"
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      )}
                    </ListItemButton>
                  ))}
                </List>
              ) : groups.length ? (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: 140,
                    px: 2,
                    textAlign: 'center',
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    No groups match your filter.
                  </Typography>
                </Box>
              ) : (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: 140,
                    px: 2,
                    textAlign: 'center',
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    You are not a member of any groups.
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        )}

        <Box
          sx={{
            p: 1.5,
            borderRadius: 2,
            border: '1px dashed',
            borderColor: 'divider',
            backgroundColor: (theme) =>
              theme.palette.mode === 'dark'
                ? 'rgba(255,255,255,0.03)'
                : 'rgba(0,0,0,0.02)',
          }}
        >
          <Typography variant="body2" color="text.secondary">
            Post to share:
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 600 }}>
            {postName || 'Unknown name'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            ID: {postId || 'Unknown'}
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions
        sx={{
          px: 3,
          py: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 2,
        }}
      >
        <Typography variant="caption" color="text.secondary">
          Forwarding flow coming next.
        </Typography>
        <Button
          variant="contained"
          color="primary"
          size="small"
          startIcon={<SendIcon fontSize="small" />}
          disabled={!canContinue}
          onClick={handleConfirm}
        >
          Continue
        </Button>
      </DialogActions>
    </Dialog>
  );
}
