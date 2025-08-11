import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  AvatarGroup,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Badge,
  Tooltip,
} from '@mui/material';
import {
  Users,
  UserPlus,
  MessageSquare,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  AlertCircle,
  Send,
  MoreVertical,
} from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: 'admin' | 'developer' | 'viewer';
  status: 'online' | 'offline' | 'away';
  lastActive: string;
}

interface Comment {
  id: string;
  author: TeamMember;
  content: string;
  timestamp: string;
  type: 'comment' | 'assignment' | 'resolution';
}

interface ErrorAssignment {
  id: string;
  errorId: string;
  assignedTo: TeamMember;
  assignedBy: TeamMember;
  assignedAt: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  dueDate?: string;
}

interface TeamCollaborationProps {
  errorId: string;
  teamMembers: TeamMember[];
  comments: Comment[];
  assignments: ErrorAssignment[];
  onAddComment: (content: string) => void;
  onAssignError: (memberId: string, priority: string, dueDate?: string) => void;
  onUpdateAssignment: (assignmentId: string, status: string) => void;
  onAddTeamMember: (member: Omit<TeamMember, 'id'>) => void;
}

const TeamCollaboration: React.FC<TeamCollaborationProps> = ({
  errorId,
  teamMembers,
  comments,
  assignments,
  onAddComment,
  onAssignError,
  onUpdateAssignment,
  onAddTeamMember,
}) => {
  const [commentText, setCommentText] = useState('');
  const [showAssignmentDialog, setShowAssignmentDialog] = useState(false);
  const [showMemberDialog, setShowMemberDialog] = useState(false);
  const [selectedMember, setSelectedMember] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('medium');
  const [dueDate, setDueDate] = useState('');

  const handleAddComment = () => {
    if (commentText.trim()) {
      onAddComment(commentText);
      setCommentText('');
    }
  };

  const handleAssignError = () => {
    if (selectedMember) {
      onAssignError(selectedMember, selectedPriority, dueDate || undefined);
      setShowAssignmentDialog(false);
      setSelectedMember('');
      setSelectedPriority('medium');
      setDueDate('');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'success';
      case 'away': return 'warning';
      case 'offline': return 'default';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'error';
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'default';
    }
  };

  const getAssignmentStatusColor = (status: string) => {
    switch (status) {
      case 'resolved': return 'success';
      case 'in_progress': return 'warning';
      case 'open': return 'info';
      case 'closed': return 'default';
      default: return 'default';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('tr-TR');
  };

  const getActiveAssignments = () => {
    return assignments.filter(a => a.status !== 'closed');
  };

  return (
    <Card>
      <CardContent>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Users size={20} />
            <Typography variant="h6">Team Collaboration</Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<UserPlus size={16} />}
              onClick={() => setShowMemberDialog(true)}
            >
              Add Member
            </Button>
            <Button
              variant="contained"
              size="small"
              startIcon={<MessageSquare size={16} />}
              onClick={() => setShowAssignmentDialog(true)}
            >
              Assign Error
            </Button>
          </Box>
        </Box>

        {/* Team Members */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Team Members ({teamMembers.length})
          </Typography>
          <AvatarGroup max={5} sx={{ mb: 2 }}>
            {teamMembers.map((member) => (
              <Tooltip key={member.id} title={`${member.name} (${member.role})`}>
                <Badge
                  overlap="circular"
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  badgeContent={
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor: getStatusColor(member.status) === 'success' ? '#4caf50' : 
                                        getStatusColor(member.status) === 'warning' ? '#ff9800' : '#757575',
                        border: '2px solid white',
                      }}
                    />
                  }
                >
                  <Avatar src={member.avatar} alt={member.name}>
                    {member.name.charAt(0)}
                  </Avatar>
                </Badge>
              </Tooltip>
            ))}
          </AvatarGroup>
        </Box>

        {/* Active Assignments */}
        {getActiveAssignments().length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Active Assignments ({getActiveAssignments().length})
            </Typography>
            <List dense>
              {getActiveAssignments().map((assignment) => (
                <ListItem key={assignment.id} sx={{ px: 0 }}>
                  <ListItemAvatar>
                    <Avatar src={assignment.assignedTo.avatar} alt={assignment.assignedTo.name}>
                      {assignment.assignedTo.name.charAt(0)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" fontWeight="medium">
                          {assignment.assignedTo.name}
                        </Typography>
                        <Chip
                          label={assignment.priority.toUpperCase()}
                          size="small"
                          color={getPriorityColor(assignment.priority)}
                        />
                        <Chip
                          label={assignment.status.replace('_', ' ').toUpperCase()}
                          size="small"
                          color={getAssignmentStatusColor(assignment.status)}
                        />
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Assigned by {assignment.assignedBy.name} on {formatTimestamp(assignment.assignedAt)}
                        </Typography>
                        {assignment.dueDate && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            Due: {formatTimestamp(assignment.dueDate)}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      size="small"
                      onClick={() => onUpdateAssignment(assignment.id, 'resolved')}
                      color="success"
                    >
                      <CheckCircle size={16} />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        <Divider sx={{ mb: 3 }} />

        {/* Comments */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Comments ({comments.length})
          </Typography>
          
          {/* Add Comment */}
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Add a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              multiline
              rows={2}
            />
            <Button
              variant="contained"
              onClick={handleAddComment}
              disabled={!commentText.trim()}
              startIcon={<Send size={16} />}
            >
              Send
            </Button>
          </Box>

          {/* Comments List */}
          <List sx={{ maxHeight: 300, overflow: 'auto' }}>
            {comments.map((comment) => (
              <ListItem key={comment.id} sx={{ px: 0, flexDirection: 'column', alignItems: 'stretch' }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, width: '100%' }}>
                  <Avatar src={comment.author.avatar} alt={comment.author.name}>
                    {comment.author.name.charAt(0)}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Typography variant="body2" fontWeight="medium">
                        {comment.author.name}
                      </Typography>
                      <Chip
                        label={comment.type.toUpperCase()}
                        size="small"
                        color={comment.type === 'resolution' ? 'success' : comment.type === 'assignment' ? 'warning' : 'default'}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {formatTimestamp(comment.timestamp)}
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                      {comment.content}
                    </Typography>
                  </Box>
                </Box>
              </ListItem>
            ))}
          </List>
        </Box>

        {/* Assignment Dialog */}
        <Dialog open={showAssignmentDialog} onClose={() => setShowAssignmentDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Assign Error</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <FormControl fullWidth>
                <InputLabel>Assign to</InputLabel>
                <Select
                  value={selectedMember}
                  label="Assign to"
                  onChange={(e) => setSelectedMember(e.target.value)}
                >
                  {teamMembers.map((member) => (
                    <MenuItem key={member.id} value={member.id}>
                      {member.name} ({member.role})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={selectedPriority}
                  label="Priority"
                  onChange={(e) => setSelectedPriority(e.target.value)}
                >
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="critical">Critical</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="Due Date (Optional)"
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowAssignmentDialog(false)}>Cancel</Button>
            <Button onClick={handleAssignError} variant="contained" disabled={!selectedMember}>
              Assign
            </Button>
          </DialogActions>
        </Dialog>

        {/* Add Member Dialog */}
        <Dialog open={showMemberDialog} onClose={() => setShowMemberDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Add Team Member</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Team member management will be implemented in the next phase.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowMemberDialog(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default TeamCollaboration;
