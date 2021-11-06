module.exports = {
  isBlock: (ctx) => {
    return (
      ctx.myChatMember.old_chat_member.status === "member" &&
      ctx.myChatMember.new_chat_member.status === "kicked"
    );
  },

  isUnblock: (ctx) => {
    return (
      ctx.myChatMember.old_chat_member.status === "kicked" &&
      ctx.myChatMember.new_chat_member.status === "member"
    );
  },
};
