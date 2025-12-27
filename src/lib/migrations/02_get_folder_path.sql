-- Recursive function to get folder path (Breadcrumbs)
create or replace function get_folder_path(folder_uuid uuid)
returns table (id uuid, name text)
language sql
stable
as $$
  with recursive folder_tree as (
    -- Base case: the current folder
    select id, name, parent_id, 1 as level
    from folders
    where id = folder_uuid
    
    union all
    
    -- Recursive step: get the parent
    select f.id, f.name, f.parent_id, ft.level + 1
    from folders f
    inner join folder_tree ft on f.id = ft.parent_id
  )
  select id, name from folder_tree order by level desc;
$$;
